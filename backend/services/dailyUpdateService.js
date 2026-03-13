import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";

import League from "../models/League.js";       // your saved leagues
import Fixture from "../models/Fixture.js";     // unified fixture model
import { fetchInjuries, fetchInjuriesByLeague } from "./enrichmentService.js";
import { updateStandings } from "./fetch_standings.js";
// Duplicate removed

import { cleanupOldFixtures } from "./cleanupService.js";

dotenv.config();

/* ---------------------------------------------
   API BASE URL + HEADERS
--------------------------------------------- */
const api = axios.create({
  baseURL: "https://v3.football.api-sports.io",
  headers: {
    "x-apisports-key": process.env.API_KEY
  }
});

/* ---------------------------------------------
   UTIL: GET DATE + N DAYS (UTC)
--------------------------------------------- */
function getDatePlus(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);

  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
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
   FETCH FIXTURES FOR MULTIPLE DATES
--------------------------------------------- */
async function fetchFixturesForDates(savedLeagueIds, daysAhead = 2) {
  let combined = [];

  // Start from day = -1 to ensure we fetch yesterday's matches and capture missed FT results
  for (let day = -1; day <= daysAhead; day++) {
    const date = getDatePlus(day);
    console.log(`📅 Fetching fixtures for ${date}`);

    try {
      const res = await api.get(`/fixtures`, {
        params: { date }
      });

      if (res.data.errors && Object.keys(res.data.errors).length > 0) {
        console.error("❌ API Errors:", JSON.stringify(res.data.errors, null, 2));
      }

      const fixtures = res.data.response || [];
      console.log(`   → Total fixtures on ${date}: ${fixtures.length}`);

      // filter by saved leagues
      // ONLY keep fixtures that match our saved leagues
      const filtered = fixtures.filter(f =>
        savedLeagueIds.includes(f.league.id)
      );

      combined = combined.concat(filtered);
    } catch (err) {
      console.error(`❌ Error fetching fixtures for date ${date}:`, err.message);
    }
  }

  return combined;
}

/* ---------------------------------------------
   FETCH PREDICTIONS (ONLY prediction + h2h)
--------------------------------------------- */
async function fetchPrediction(fixtureId) {
  try {
    const res = await api.get(`/predictions`, {
      params: { fixture: fixtureId }
    });

    const data = res.data?.response?.[0];
    if (!data) return { prediction: null, h2h: null };

    return {
      prediction: data.predictions || null,
      h2h: data.h2h || null
    };

  } catch (err) {
    console.log(`⚠ Prediction not available for fixture ${fixtureId}: ${err.message}`);
    return { prediction: null, h2h: null };
  }
}

/* ---------------------------------------------
   FETCH ODDS (FALLBACK LOGIC)
--------------------------------------------- */
async function fetchOdds(fixtureId) {
  try {
    // Attempt Bet365 (8)
    let res = await api.get(`/odds`, {
      params: { fixture: fixtureId, bookmaker: 8 }
    });

    let odds = res.data?.response?.[0];

    // If Bet365 doesn't have odds, fallback to 1xBet (11)
    if (!odds || !odds.bookmakers || odds.bookmakers.length === 0) {
      console.log(`   🔄 Bet365 odds missing for ${fixtureId}, falling back to 1xBet...`);
      res = await api.get(`/odds`, {
        params: { fixture: fixtureId, bookmaker: 11 }
      });
      odds = res.data?.response?.[0];
    }

    if (!odds || !odds.bookmakers) return [];

    return odds.bookmakers.map(b => ({
      bookmaker: b.name,
      markets: b.bets
        .filter(m => m.name === "Match Winner") // 🔥 FILTER: Only keep Match Winner
        .map(m => ({
          id: m.id,
          name: m.name,
          values: m.values.map(v => ({
            value: v.value,
            odd: v.odd
          }))
        }))
    }));

  } catch (err) {
    console.log(`⚠ Odds not available for fixture ${fixtureId}: ${err.message}`);
    return [];
  }
}

/* ---------------------------------------------
   MAIN: UPDATE DAILY FIXTURES
--------------------------------------------- */
export async function updateDailyFixtures() {
  try {
    // MongoDB should already be connected by server.js
    console.log("📡 Updating fixtures from today up to +7 days...\n");

    // 0. CHECK LAST RUN TO PREVENT RESTART-BURNOUT
    // Every time server restarts, this runs. If we restart 5 times, we burn 5x requests.
    // Solution: Check DB.

    // Dynamic import to avoid circular dep issues at top level if any
    const SystemConfig = (await import("../models/SystemConfig.js")).default;

    const lastRunConfig = await SystemConfig.findOne({ key: "lastDailyUpdate" });
    const now = new Date();

    if (lastRunConfig && lastRunConfig.value) {
      const lastRun = new Date(lastRunConfig.value);
      const hoursCheck = 18; // Only allow run if > 18 hours have passed
      const msSinceLast = now - lastRun;

      if (msSinceLast < hoursCheck * 60 * 60 * 1000) {
        console.log(`⏳ Daily Update already ran at ${lastRun.toISOString()}. Skipping to save API quota.`);
        console.log(`   (Next run allowed after ${hoursCheck} hours)`);
        return;
      }
    }

    // 1. Load saved leagues
    const savedLeagueIds = await getSavedLeagueIds();
    if (savedLeagueIds.length === 0) {
      console.log("⚠ No saved leagues found. Add leagues first.");
      return;
    }

    // 2. Fetch fixtures for multiple days (Reduced from 7 to 2 to save API quota)
    const fixtures = await fetchFixturesForDates(savedLeagueIds, 2);

    if (fixtures.length === 0) {
      console.log("⚠ No fixtures found for saved leagues between yesterday and +2 days.");
      return;
    }

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
    let processedCount = 0;
    for (const f of fixtures) {
      const fixtureId = f.fixture.id;
      processedCount++;
      if (processedCount % 50 === 0) {
        console.log(`   ⏳ Processing fixture ${processedCount} / ${fixtures.length}...`);
      }

      // Check if we already have this fixture
      const existingDoc = await Fixture.findOne({ fixtureId: fixtureId }).lean();

      // OPTIMIZATION: Skip prediction/odds fetch if match is finished
      const isFinished = f.fixture?.status?.short && ["FT", "AET", "PEN"].includes(f.fixture.status.short);

      let prediction = null;
      let h2h = null;
      let bets = [];

      // 1️⃣ predictions
      // If we already have a prediction object in the DB, OR if the match is finished, SKIP fetching it again.
      if (existingDoc && existingDoc.prediction && Object.keys(existingDoc.prediction).length > 0) {
        prediction = existingDoc.prediction;
        h2h = existingDoc.h2h;
      } else if (!isFinished) {
        // Only fetch if missing AND match isn't finished
        const predResult = await fetchPrediction(fixtureId);
        prediction = predResult.prediction;
        h2h = predResult.h2h;
      }

      // 3️⃣ odds
      // We ALWAYS fetch fresh odds during the daily run (unless the match is finished)
      // because odds fluctuate leading up to the match day.
      if (!isFinished) {
        bets = await fetchOdds(fixtureId);
      } else if (existingDoc && existingDoc.odds && existingDoc.odds.length > 0) {
        // If finished, just preserve whatever the final pre-match odds were
        bets = existingDoc.odds;
      }

      // 4️⃣ injuries (Weekly Forecast)
      let injuryReport = injuriesByFixture[fixtureId] || [];

      // 5️⃣ PRESERVE DATA LOGIC
      if (existingDoc && existingDoc.fixture && existingDoc.fixture.events && existingDoc.fixture.events.length > 0) {
        // If the NEW data 'f' has no events (or empty), keep the OLD events
        if (!f.events || f.events.length === 0) {
          f.events = existingDoc.fixture.events;
        }
      }

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
            prediction,
            h2h,
            odds: bets,
            injuries: injuryReport
          },
          // 🧹 Ensure we clear any stale live data (if match is truly live, liveScoreService will restore it in 5s)
          $unset: { livescore: 1, liveOdds: 1 }
        },
        { upsert: true }
      );

      // console.log(`✔ Saved fixture ${fixtureId}`);
    }

    // 6️⃣ Update Standings
    console.log("📊 Updating Standings...");
    await updateStandings(false);



    // 7.5️⃣ CLEANUP OLD DATA
    await cleanupOldFixtures();

    // 8️⃣ SAVE COMPLETION TIME (LOCK THE RUN UNTIL TOMORROW)
    // Only happens if the *entire* loop finished successfully!
    await SystemConfig.findOneAndUpdate(
      { key: "lastDailyUpdate" },
      { value: new Date() },
      { upsert: true }
    );

    console.log("\n🎉 FULL DAILY UPDATE COMPLETED");

  } catch (err) {
    console.error("❌ ERROR UPDATING FIXTURES/DATA:", err);
  }
}

export function startDailyScheduler() {
  console.log("⏰ Daily Update Scheduler Started (Runs every 24h, first run in 5 mins)");

  // Delay the first run by 5 minutes to allow server startup/health-checks to pass
  setTimeout(() => {
    console.log("⏰ Starting initial Daily Update...");
    updateDailyFixtures();
  }, 5 * 60 * 1000);

  // Then schedule the daily interval
  setInterval(() => {
    updateDailyFixtures();
  }, 24 * 60 * 60 * 1000);
}

/* ---------------------------------------------
   RUN IF EXECUTED DIRECTLY
--------------------------------------------- */
if (process.argv[1].includes("dailyUpdateService.js")) {
  const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log("🔌 Connected to MongoDB for manual run");
      return updateDailyFixtures();
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
