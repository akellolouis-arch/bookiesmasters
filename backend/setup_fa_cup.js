import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";
import League from "./models/League.js";
import Fixture from "./models/Fixture.js";
import { updateDailyFixtures } from "./services/dailyUpdateService.js";

dotenv.config();

const API_KEY = process.env.API_KEY;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";

const api = axios.create({
    baseURL: "https://v3.football.api-sports.io",
    headers: {
        "x-apisports-key": API_KEY
    }
});

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // 1. Search for FA Cup
        console.log("🔍 Searching for 'FA Cup'...");
        const searchRes = await api.get("/leagues", {
            params: { search: "FA Cup" }
        });

        const leagues = searchRes.data.response;
        const faCup = leagues.find(l => l.country.name === "England" && l.league.name === "FA Cup");

        if (!faCup) {
            console.error("❌ FA Cup (England) not found in API results.");
            console.log("Results found:", leagues.map(l => `${l.league.name} (${l.country.name})`));
            process.exit(1);
        }

        console.log(`✅ Found FA Cup: ID ${faCup.league.id}`);

        // 2. Add to Leagues collection
        console.log("💾 Saving FA Cup to 'leagues' collection...");
        await League.findOneAndUpdate(
            { "league.id": faCup.league.id },
            {
                league: {
                    id: faCup.league.id,
                    name: faCup.league.name,
                    type: faCup.league.type,
                    logo: faCup.league.logo
                },
                country: {
                    name: faCup.country.name,
                    code: faCup.country.code,
                    flag: faCup.country.flag
                },
                seasons: faCup.seasons, // Save season info too
                active: true,
                odds: true // assuming we want odds
            },
            { upsert: true, new: true }
        );
        console.log("✅ FA Cup saved/updated in DB.");

        // 3. Fetch fixtures alone for today (as requested)
        // Actually the user asked to "fetch its fixtures alone" for today.
        // I can reuse the logic from fetchFixturesForDates but restricted to this league and today.

        const today = new Date().toISOString().split('T')[0];
        console.log(`📅 Fetching FA Cup fixtures for today (${today})...`);

        const fixturesRes = await api.get("/fixtures", {
            params: {
                league: faCup.league.id,
                season: faCup.seasons[faCup.seasons.length - 1].year, // current season
                date: today
            }
        });

        const fixtures = fixturesRes.data.response || [];
        console.log(`✅ Found ${fixtures.length} fixtures for today.`);

        if (fixtures.length > 0) {
            for (const f of fixtures) {
                // We'll save with basic info, dailyUpdateService does enrichments (odds, predictions).
                // If we want FULL data now, we should probably call the enrichment-like logic.
                // But for a quick "fetch its fixtures" this might be enough to get them in DB.
                // However, the frontend might rely on 'odds' and 'prediction' fields.
                // Let's just save basic for now, and maybe trigger dailyUpdateService logic or manual enrichment if needed.
                // The user said "future daily update runs fetch its fixtures", implying automation will handle it later.

                await Fixture.findOneAndUpdate(
                    { fixtureId: f.fixture.id },
                    {
                        fixtureId: f.fixture.id,
                        fixture: f,
                        // Initialize others as null/empty if missing, to match schema
                        prediction: null,
                        h2h: null,
                        odds: [],
                        injuries: []
                    },
                    { upsert: true }
                );
            }
            console.log(`✅ Saved ${fixtures.length} fixtures to DB.`);
        } else {
            console.log("No fixtures to save today.");
        }

        console.log("🎉 Done.");
        process.exit(0);

    } catch (err) {
        console.error("❌ Error:", err.message);
        if (err.response) {
            console.error("API Response:", err.response.data);
        }
        process.exit(1);
    }
}

run();
