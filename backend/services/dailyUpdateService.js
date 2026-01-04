import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";

import League from "../models/League.js";       // your saved leagues
import Fixture from "../models/Fixture.js";     // unified fixture model
import { fetchInjuries } from "./enrichmentService.js";
import { updateStandings } from "./fetch_standings.js";
import { updateTopScorers } from "./fetchTopScorers.js";

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

  for (let day = 0; day <= daysAhead; day++) {
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
   FETCH ODDS (ONLY 1 BOOKMAKER)
--------------------------------------------- */
async function fetchOdds(fixtureId) {
  try {
    const res = await api.get(`/odds`, {
      params: {
        fixture: fixtureId,
        bookmaker: 8   // Bet365
      }
    });

    const odds = res.data?.response?.[0];
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

    // 2. Fetch fixtures for multiple days
    const fixtures = await fetchFixturesForDates(savedLeagueIds, 7);

    if (fixtures.length === 0) {
      console.log("⚠ No fixtures found for saved leagues between today and +7 days.");
      return;
    }

    // 3. Process each fixture
    for (const f of fixtures) {
      const fixtureId = f.fixture.id;

      // 1️⃣ predictions
      const { prediction, h2h } = await fetchPrediction(fixtureId);

      // 3️⃣ odds
      const bets = await fetchOdds(fixtureId);

      // 4️⃣ injuries (Weekly Forecast)
      const injuryReport = await fetchInjuries(fixtureId);

      // 5️⃣ PRESERVE DATA LOGIC
      // Check if we already have this fixture and if it has valid events
      const existingDoc = await Fixture.findOne({ fixtureId: fixtureId }).lean();

      if (existingDoc && existingDoc.fixture && existingDoc.fixture.events && existingDoc.fixture.events.length > 0) {
        // If the NEW data 'f' has no events (or empty), keep the OLD events
        if (!f.events || f.events.length === 0) {
          console.log(`🛡️ Preserving ${existingDoc.fixture.events.length} existing events for fixture ${fixtureId}`);
          f.events = existingDoc.fixture.events;
        }
      }

      // 6️⃣ save/update in Mongo
      await Fixture.findOneAndUpdate(
        { fixtureId: fixtureId },
        {
          fixtureId: fixtureId,
          fixture: f,
          prediction,
          h2h,
          odds: bets,
          injuries: injuryReport
        },
        { upsert: true }
      );

      // console.log(`✔ Saved fixture ${fixtureId}`);
    }

    // 6️⃣ Update Standings
    console.log("📊 Updating Standings...");
    await updateStandings(false);

    // 7️⃣ Update Top Scorers
    console.log("⚽ Updating Top Scorers...");
    await updateTopScorers(false);

    // 8️⃣ SAVE COMPLETION TIME
    const SystemConfig = (await import("../models/SystemConfig.js")).default;
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
