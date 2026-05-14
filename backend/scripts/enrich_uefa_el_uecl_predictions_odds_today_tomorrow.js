/**
 * Fetch predictions + odds for UEFA Europa League (3) and Conference League (848)
 * only, for fixtures whose kickoff falls on Kenya **today** or **tomorrow** — same
 * rules as dailyUpdateService (finished / recent / preserve odds, inter-fixture delay).
 *
 * Does NOT: refresh fixture list from API, injuries bulk fetch, standings, cleanup,
 * or touch lastDailyUpdate.
 *
 * Usage:
 *   node scripts/enrich_uefa_el_uecl_predictions_odds_today_tomorrow.js --yes
 *
 * Env:
 *   UEFA_EL_UECL_LEAGUE_IDS=3,848   (optional)
 *   DAILY_INTER_FIXTURE_DELAY_MS    (optional, default 120)
 *
 * Requires: API_KEY, MONGO_URI (backend/.env and/or .env.local)
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

import Fixture from "../models/Fixture.js";
import {
  applyMongoDnsHints,
  getMongoClientOptions,
} from "../mongoConnectOptions.js";
import {
  fetchOdds,
  fetchPrediction,
  isFinishedStatusShort,
} from "../services/fixturePredictionOddsApi.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({
  path: path.resolve(__dirname, "../../.env.local"),
  override: true,
});

const KENYA_TZ = "Africa/Nairobi";
const kenyaYmdFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: KENYA_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function getKenyaDatePlus(offsetDays) {
  const todayYmd = kenyaYmdFormatter.format(new Date());
  const [y, m, d] = todayYmd.split("-").map(Number);
  const base = new Date(
    `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T00:00:00+03:00`
  );
  const target = new Date(base.getTime() + offsetDays * 86400000);
  return kenyaYmdFormatter.format(target);
}

function getDatePlus(days) {
  return getKenyaDatePlus(days);
}

function toKenyaDateOnly(dateTimeIso) {
  if (!dateTimeIso) return null;
  const d = new Date(dateTimeIso);
  if (Number.isNaN(d.getTime())) return null;
  return kenyaYmdFormatter.format(d);
}

function readInterFixtureDelayMs() {
  const raw = process.env.DAILY_INTER_FIXTURE_DELAY_MS;
  if (raw === undefined || raw === "") return 120;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 120;
  return n;
}

function parseLeagueIds() {
  const raw = process.env.UEFA_EL_UECL_LEAGUE_IDS;
  if (!raw || !String(raw).trim()) return [3, 848];
  return String(raw)
    .split(/[,\s]+/)
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

async function main() {
  const yes = process.argv.includes("--yes");
  if (!yes) {
    console.error("Refusing to run without --yes (writes predictions/odds to MongoDB).");
    process.exit(1);
  }

  if (!process.env.API_KEY) {
    console.error("API_KEY missing");
    process.exit(1);
  }
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI missing");
    process.exit(1);
  }

  applyMongoDnsHints();
  await mongoose.connect(process.env.MONGO_URI, getMongoClientOptions());

  const leagueIds = parseLeagueIds();
  const todayYmd = getKenyaDatePlus(0);
  const tomorrowYmd = getKenyaDatePlus(1);
  const startIso = new Date(`${todayYmd}T00:00:00+03:00`).toISOString();
  const endIso = new Date(`${tomorrowYmd}T23:59:59.999+03:00`).toISOString();

  console.log(
    `📅 Kenya window: ${todayYmd} .. ${tomorrowYmd} (UTC range ${startIso} .. ${endIso})`
  );
  console.log(`🏟️ League ids: ${leagueIds.join(", ")}\n`);

  const docs = await Fixture.find({
    fixtureId: { $exists: true },
    "fixture.league.id": { $in: leagueIds },
    "fixture.fixture.date": { $gte: startIso, $lte: endIso },
  })
    .lean()
    .select({
      fixtureId: 1,
      fixture: 1,
      prediction: 1,
      h2h: 1,
      odds: 1,
      injuries: 1,
    });

  console.log(`Found ${docs.length} fixtures to enrich.\n`);

  const backfillRecentFinished = process.env.BACKFILL_RECENT_FINISHED === "1";
  const yesterdayDate = getDatePlus(-1);
  const todayDate = getDatePlus(0);
  const tomorrowDate = getDatePlus(1);
  const interFixtureDelayMs = readInterFixtureDelayMs();

  let statsPredFilled = 0;
  let statsNsWithOdds = 0;
  let statsNsOddsStillEmpty = 0;
  let n = 0;

  for (const existingDoc of docs) {
    n++;
    if (n % 20 === 0) {
      console.log(`   ⏳ ${n} / ${docs.length}...`);
    }

    const fixtureId = existingDoc.fixtureId;
    const f = existingDoc.fixture;
    if (!f?.fixture?.id) {
      console.warn(`⚠ Skip fixtureId ${fixtureId}: missing nested fixture`);
      continue;
    }

    const statusFromApi = f.fixture?.status?.short;
    const statusFromDb =
      existingDoc?.fixture?.fixture?.status?.short ??
      existingDoc?.fixture?.status?.short;
    const isFinished =
      isFinishedStatusShort(statusFromApi) || isFinishedStatusShort(statusFromDb);

    const fixtureDateOnly = toKenyaDateOnly(f.fixture?.date);
    const isRecentFixture =
      fixtureDateOnly === yesterdayDate ||
      fixtureDateOnly === todayDate ||
      fixtureDateOnly === tomorrowDate;
    const allowFetchForFinished = backfillRecentFinished && isRecentFixture;
    const mayCallPredOddsApis = !isFinished || allowFetchForFinished;

    let prediction = null;
    let h2h = null;
    let bets = [];

    if (
      existingDoc.prediction &&
      Object.keys(existingDoc.prediction).length > 0
    ) {
      prediction = existingDoc.prediction;
      h2h = existingDoc.h2h;
    } else if (mayCallPredOddsApis) {
      const predResult = await fetchPrediction(fixtureId);
      prediction = predResult.prediction;
      h2h = predResult.h2h;
      if (prediction && Object.keys(prediction).length > 0) statsPredFilled += 1;
    }

    if (!isFinished) {
      bets = await fetchOdds(fixtureId);
    } else if (existingDoc?.odds?.length > 0) {
      bets = existingDoc.odds;
    } else if (isRecentFixture) {
      bets = await fetchOdds(fixtureId);
    }

    if (
      (!bets || bets.length === 0) &&
      existingDoc.odds &&
      existingDoc.odds.length > 0
    ) {
      bets = existingDoc.odds;
    }

    if (!isFinished && statusFromApi === "NS") {
      if (bets && bets.length > 0) statsNsWithOdds += 1;
      else statsNsOddsStillEmpty += 1;
    }

    const injuryReport = existingDoc.injuries || [];

    if (
      existingDoc.fixture?.events &&
      existingDoc.fixture.events.length > 0 &&
      (!f.events || f.events.length === 0)
    ) {
      f.events = existingDoc.fixture.events;
    }

    await Fixture.findOneAndUpdate(
      { fixtureId },
      {
        $set: {
          fixtureId,
          fixture: f,
          prediction,
          h2h,
          odds: bets,
          injuries: injuryReport,
        },
        $unset: { livescore: 1, liveOdds: 1 },
      },
      { upsert: false }
    );

    if (interFixtureDelayMs > 0) {
      await new Promise((r) => setTimeout(r, interFixtureDelayMs));
    }
  }

  console.log(
    `\n📈 Done. predictions filled (this run): ${statsPredFilled}; NS — with odds: ${statsNsWithOdds}, still empty: ${statsNsOddsStillEmpty} (delay ${interFixtureDelayMs}ms/fixture)`
  );

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
