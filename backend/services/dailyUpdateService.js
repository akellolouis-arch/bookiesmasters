import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import League from "../models/League.js";       // your saved leagues
import Fixture from "../models/Fixture.js";     // unified fixture model
import { fetchInjuries, fetchInjuriesByLeague } from "./enrichmentService.js";
import { updateStandings } from "./fetch_standings.js";
// Duplicate removed

import { cleanupOldFixtures } from "./cleanupService.js";
import {
  applyMongoDnsHints,
  getMongoClientOptions,
} from "../mongoConnectOptions.js";
import {
  fetchPrediction,
  getFootballApi,
  isFinishedStatusShort,
} from "./fixturePredictionOddsApi.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({
  path: path.resolve(__dirname, "../../.env.local"),
  override: true,
});

/** Same as server.js — Atlas TLS/DNS on Render, etc. */
const MONGO_CONNECT_OPTIONS = getMongoClientOptions();

/* ---------------------------------------------
   DATES: align with site (Africa/Nairobi), not UTC
   Frontend uses Kenya calendar for /predictions/YYYY-MM-DD; UTC getDatePlus
   was shifting "day after tomorrow" vs API fixture buckets.
--------------------------------------------- */
const KENYA_TZ = "Africa/Nairobi";

const kenyaYmdFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: KENYA_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** YYYY-MM-DD for "today" in Kenya + offset calendar days. */
function getKenyaDatePlus(offsetDays) {
  const todayYmd = kenyaYmdFormatter.format(new Date());
  const [y, m, d] = todayYmd.split("-").map(Number);
  const base = new Date(
    `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T00:00:00+03:00`
  );
  const target = new Date(base.getTime() + offsetDays * 86400000);
  return kenyaYmdFormatter.format(target);
}

/** Legacy name: used for logs / backfill flags — now Kenya-based. */
function getDatePlus(days) {
  return getKenyaDatePlus(days);
}

/** Calendar day in Kenya for a fixture kickoff (matches date navigator). */
function toKenyaDateOnly(dateTimeIso) {
  if (!dateTimeIso) return null;
  const d = new Date(dateTimeIso);
  if (Number.isNaN(d.getTime())) return null;
  return kenyaYmdFormatter.format(d);
}

/**
 * Milliseconds until the next `hour`:`minute` wall clock in Africa/Nairobi.
 * Kenya is UTC+3 year-round (no DST), so +03:00 is stable.
 */
function msUntilNextKenyaWallClock(hour, minute = 0) {
  const now = new Date();
  const ymd = kenyaYmdFormatter.format(now);
  const [y, m, d] = ymd.split("-").map(Number);
  const pad = (n) => String(n).padStart(2, "0");
  let target = new Date(
    `${y}-${pad(m)}-${pad(d)}T${pad(hour)}:${pad(minute)}:00+03:00`
  );
  if (target.getTime() <= now.getTime()) {
    target = new Date(target.getTime() + 86400000);
  }
  return target.getTime() - now.getTime();
}

/** Start of calendar day `ymd` (YYYY-MM-DD) in Kenya, as UTC ms. */
function getKenyaDayStartMs(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(
    `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T00:00:00+03:00`
  ).getTime();
}

/* ---------------------------------------------
   LOAD SAVED LEAGUES FROM MONGO
--------------------------------------------- */
async function getSavedLeagueIds() {
  const leagues = await League.find({});
  // console.log(`Found ${leagues.length} saved leagues.`);
  return leagues.map(l => l.league.id);
}

/* ---------------------------------------------
   FETCH FIXTURES — one GET /fixtures per Kenya calendar day, `date` ONLY.
   API-Sports currently rejects `page`, `timezone`, and bare `from`/`to` in our tests;
   extra params trigger "field do not exist" / "need another parameter".
--------------------------------------------- */
const BETWEEN_DAY_REQUESTS_MS = 400;

/**
 * Pause after each fixture enrichment (predictions + odds + save). API-Football will
 * return empty bodies or 429 if requests are burst; ~1k+ fixtures × 2+ calls without delay
 * often leaves “tomorrow” (processed late in the loop) with odds: [] and prediction: null.
 * Env DAILY_INTER_FIXTURE_DELAY_MS (ms, default 120; set 0 to disable).
 */
function readInterFixtureDelayMs() {
  const raw = process.env.DAILY_INTER_FIXTURE_DELAY_MS;
  if (raw === undefined || raw === "") return 120;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 120;
  return n;
}

function getFixtureApiErrors(body) {
  const e = body?.errors;
  if (!e || typeof e !== "object") return null;
  const keys = Object.keys(e);
  return keys.length ? e : null;
}

/** Single request: ?date=YYYY-MM-DD (no pagination params). */
async function fetchFixturesForOneDate(date) {
  const res = await getFootballApi().get(`/fixtures`, {
    params: { date },
  });
  const body = res.data;
  const errs = getFixtureApiErrors(body);
  if (errs) {
    console.error(`❌ API Errors (${date}):`, JSON.stringify(errs, null, 2));
    return [];
  }
  const rows = body?.response || [];
  const total = body?.paging?.total ?? 1;
  if (total > 1) {
    console.warn(
      `⚠ ${date}: API reports paging.total=${total} but \`page\` is not accepted — using first response only (${rows.length} rows).`
    );
  }
  return rows;
}

/**
 * Kenya window: today .. today+daysAhead (inclusive) only — no yesterday, no buffer days (saves API quota).
 * Pull each calendar day separately with `date=` only.
 */
async function fetchFixturesForDates(savedLeagueIds, daysAhead = 1) {
  let raw = [];

  const startYmd = getKenyaDatePlus(0);
  const endYmd = getKenyaDatePlus(daysAhead);

  console.log(
    `📅 Fetching fixtures per Kenya day (${startYmd} .. ${endYmd}) only, param: date only`
  );

  for (let day = 0; day <= daysAhead; day++) {
    const date = getKenyaDatePlus(day);
    // eslint-disable-next-line no-await-in-loop
    const dayRows = await fetchFixturesForOneDate(date);
    console.log(`   → ${date}: ${dayRows.length} fixture rows`);
    raw.push(...dayRows);
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, BETWEEN_DAY_REQUESTS_MS));
  }

  // Dedupe by fixture id
  const byId = new Map();
  for (const f of raw) {
    const id = f?.fixture?.id;
    if (id != null) byId.set(id, f);
  }
  const unique = [...byId.values()];

  // Keep Kenya kickoff inside [today .. +daysAhead] only
  const inWindow = unique.filter((f) => {
    const ymd = toKenyaDateOnly(f?.fixture?.date);
    if (!ymd) return false;
    return ymd >= startYmd && ymd <= endYmd;
  });

  const filtered = inWindow.filter((f) => savedLeagueIds.includes(f.league.id));
  console.log(
    `   → Unique: ${unique.length}, Kenya window ${startYmd}..${endYmd}: ${inWindow.length}, saved leagues: ${filtered.length}`
  );

  return filtered;
}

let isDailyUpdateRunning = false;

/* ---------------------------------------------
   MAIN: UPDATE DAILY FIXTURES
   - force: bypass last-run time check when true
   - recordCompletion: whether to update lastDailyUpdate timestamp
---------------------------------------------- */
export async function updateDailyFixtures(force = false, recordCompletion = true) {
  if (isDailyUpdateRunning) {
    console.log("⏳ Daily update is already running, skipping overlapping invocation.");
    return;
  }
  isDailyUpdateRunning = true;

  try {
    // MongoDB should already be connected by server.js
    console.log("📡 Updating fixtures (Kenya dates: today through +1 days only)...\n");

    // 0. CHECK LAST RUN — at most once per Kenya calendar day (not rolling 24h).
    // Rolling 24h broke a fixed clock schedule: e.g. Monday 10:05 run → Tuesday 10:00 is only ~23h55m → skip.
    // Deploy/restart no longer triggers an immediate run; the scheduler waits for the next Kenya wall time.

    // Dynamic import to avoid circular dep issues at top level if any
    const SystemConfig = (await import("../models/SystemConfig.js")).default;

    const lastRunConfig = await SystemConfig.findOne({ key: "lastDailyUpdate" });
    const now = new Date();

    if (!force && lastRunConfig && lastRunConfig.value) {
      const lastRun = new Date(lastRunConfig.value);
      const todayKenya = kenyaYmdFormatter.format(now);
      const startOfTodayKenyaMs = getKenyaDayStartMs(todayKenya);

      if (lastRun.getTime() >= startOfTodayKenyaMs) {
        console.log(
          `⏳ Daily update already completed for Kenya date ${todayKenya} (last ${lastRun.toISOString()}). Skipping.`
        );
        return;
      }
    }

    // 1. Load saved leagues
    const savedLeagueIds = await getSavedLeagueIds();
    if (savedLeagueIds.length === 0) {
      console.log("⚠ No saved leagues found. Add leagues first.");
      return;
    }

    // 2. Fetch fixtures: Kenya today .. today+1 only (no extra buffer days)
    const fixtures = await fetchFixturesForDates(savedLeagueIds, 1);

    if (fixtures.length === 0) {
      console.log("⚠ No fixtures found for saved leagues between today and +1 Kenya days.");
      return;
    }

    const interFixtureDelayMs = readInterFixtureDelayMs();
    console.log(
      `   ⏱️ Inter-fixture delay: ${interFixtureDelayMs}ms (~${Math.round(
        (fixtures.length * interFixtureDelayMs) / 60000
      )} min throttle overhead for ${fixtures.length} fixtures)`
    );

    // 2.5 Fetch all injuries for the required leagues in ONE go per league
    const leagueSeasonMap = new Map();
    for (const f of fixtures) {
      if (!f.league || !f.league.id || !f.league.season) continue;
      const key = `${f.league.id}-${f.league.season}`;
      if (!leagueSeasonMap.has(key)) {
        leagueSeasonMap.set(key, { leagueId: f.league.id, season: f.league.season });
      }
    }

    const injuriesByFixture = {};
    console.log(`🚑 Pulling all injuries for ${leagueSeasonMap.size} unique leagues...`);
    for (const lg of leagueSeasonMap.values()) {
      const leagueInjuries = await fetchInjuriesByLeague(lg.leagueId, lg.season);
      for (const injury of leagueInjuries) {
        if (!injury.fixture || !injury.fixture.id) continue;
        const fixId = injury.fixture.id;
        if (!injuriesByFixture[fixId]) {
          injuriesByFixture[fixId] = [];
        }
        injuriesByFixture[fixId].push(injury);
      }
    }

    // 3. Process each fixture
    const backfillRecentFinished = process.env.BACKFILL_RECENT_FINISHED === "1";
    const yesterdayDate = getDatePlus(-1);
    const todayDate = getDatePlus(0);
    const tomorrowDate = getDatePlus(1);

    let processedCount = 0;

    for (const f of fixtures) {
      const fixtureId = f.fixture.id;
      processedCount++;
      if (processedCount % 50 === 0) {
        console.log(`   ⏳ Processing fixture ${processedCount} / ${fixtures.length}...`);
      }

      // Check if we already have this fixture
      const existingDoc = await Fixture.findOne({ fixtureId: fixtureId }).lean();

      const statusFromApi = f.fixture?.status?.short;
      const statusFromDb =
        existingDoc?.fixture?.fixture?.status?.short ?? existingDoc?.fixture?.status?.short;
      const isFinished =
        isFinishedStatusShort(statusFromApi) || isFinishedStatusShort(statusFromDb);

      const fixtureDateOnly = toKenyaDateOnly(f.fixture?.date);
      // Same rough window as fetch (today..tomorrow Kenya): used for FT odds backfill when DB is empty.
      const isRecentFixture =
        fixtureDateOnly === yesterdayDate ||
        fixtureDateOnly === todayDate ||
        fixtureDateOnly === tomorrowDate;
      const allowFetchForFinished = backfillRecentFinished && isRecentFixture;

      // Predictions API for finished games only if BACKFILL_RECENT_FINISHED=1 (quota). Odds: see block below.
      const mayCallPredOddsApis = !isFinished || allowFetchForFinished;

      let h2h = null;

      // 1️⃣ h2h — skip API for finished (reuse DB only)
      if (existingDoc && existingDoc.h2h && existingDoc.h2h.length > 0) {
        h2h = existingDoc.h2h;
      } else if (mayCallPredOddsApis) {
        const predResult = await fetchPrediction(fixtureId);
        h2h = predResult.h2h;
      }

      // 4️⃣ injuries (Weekly Forecast)
      let injuryReport = injuriesByFixture[fixtureId] || [];

      // 5.1️⃣ PRESERVE INJURIES LOGIC
      if (existingDoc && existingDoc.injuries && existingDoc.injuries.length > 0) {
        if (!injuryReport || injuryReport.length === 0) {
          injuryReport = existingDoc.injuries;
        }
      }

      // 6️⃣ save/update in Mongo
      await Fixture.findOneAndUpdate(
        { fixtureId: fixtureId },
        {
          $set: {
            fixtureId: fixtureId,
            fixture: f,
            h2h,
            injuries: injuryReport
          },
          // 🧹 Ensure we clear any stale live data (if match is truly live, liveScoreService will restore it in 5s)
          $unset: { livescore: 1 }
        },
        { upsert: true }
      );

      if (interFixtureDelayMs > 0) {
        await new Promise((r) => setTimeout(r, interFixtureDelayMs));
      }
    }

    console.log(
      `📈 Enrichment summary: delay ${interFixtureDelayMs}ms/fixture`
    );

    // 6️⃣ Update Standings
    console.log("📊 Updating Standings...");
    await updateStandings(false);



    // 7.5️⃣ CLEANUP OLD DATA
    await cleanupOldFixtures();

    // 8️⃣ SAVE COMPLETION TIME (LOCK THE RUN UNTIL TOMORROW)
    // Only happens if the *entire* loop finished successfully and recordCompletion is true
    if (recordCompletion) {
      await SystemConfig.findOneAndUpdate(
        { key: "lastDailyUpdate" },
        { value: new Date() },
        { upsert: true }
      );
    }

    console.log("\n🎉 FULL DAILY UPDATE COMPLETED");

  } catch (err) {
    console.error("❌ ERROR UPDATING FIXTURES/DATA:", err);
  } finally {
    isDailyUpdateRunning = false;
  }
}

const DAILY_UPDATE_HOUR = Number.isFinite(Number(process.env.DAILY_UPDATE_HOUR))
  ? Number(process.env.DAILY_UPDATE_HOUR)
  : 0;
const DAILY_UPDATE_MINUTE = Number.isFinite(Number(process.env.DAILY_UPDATE_MINUTE))
  ? Number(process.env.DAILY_UPDATE_MINUTE)
  : 1;

function scheduleNextDailyUpdate() {
  const delay = msUntilNextKenyaWallClock(DAILY_UPDATE_HOUR, DAILY_UPDATE_MINUTE);
  const nextRun = new Date(Date.now() + delay);
  const mm = String(DAILY_UPDATE_MINUTE).padStart(2, "0");
  console.log(
    `⏰ Next daily update: ${nextRun.toISOString()} (in ~${Math.round(delay / 60000)} min) — Africa/Nairobi ${DAILY_UPDATE_HOUR}:${mm}`
  );

  setTimeout(async () => {
    console.log(
      `⏰ Scheduled daily update (${DAILY_UPDATE_HOUR}:${String(DAILY_UPDATE_MINUTE).padStart(2, "0")} Kenya) starting...`
    );
    try {
      await updateDailyFixtures(false, true);
    } catch (err) {
      console.error("❌ Scheduled daily update failed:", err);
    } finally {
      scheduleNextDailyUpdate();
    }
  }, delay);
}

export function startDailyScheduler() {
  console.log(
    `⏰ Daily Update Scheduler: runs every day at ${DAILY_UPDATE_HOUR}:${String(DAILY_UPDATE_MINUTE).padStart(2, "0")} Africa/Nairobi`
  );

  // Attempt an immediate run on backend startup in case we missed today's scheduled time.
  console.log(`⏰ Checking if daily update needs to run immediately upon startup...`);
  updateDailyFixtures(false, true).catch((err) => {
    console.error("❌ Startup daily update failed:", err);
  });

  // First fire is the next scheduled time
  scheduleNextDailyUpdate();
}

/* ---------------------------------------------
   RUN IF EXECUTED DIRECTLY
--------------------------------------------- */
if (process.argv[1].includes("dailyUpdateService.js")) {
  applyMongoDnsHints();
  const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";
  mongoose.connect(MONGO_URI, MONGO_CONNECT_OPTIONS)
    .then(() => {
      const backfillRecentFinished = process.env.BACKFILL_RECENT_FINISHED === "1";
      console.log(
        `🔌 Connected to MongoDB for manual run (FORCED, does not shift scheduled daily run)${backfillRecentFinished ? " + BACKFILL_RECENT_FINISHED" : ""}`
      );
      // force = true, recordCompletion = false
      return updateDailyFixtures(true, false);
    })
    .then(() => {
      console.log("✅ Manual run complete");
      process.exit(0);
    })
    .catch(err => {
      console.error("❌ Manual run failed:", err);
      process.exit(1);
    });
}
