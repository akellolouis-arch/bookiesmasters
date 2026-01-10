import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Fixture from "./models/Fixture.js";

dotenv.config({ path: "backend/.env" });
dotenv.config(); // Fallback

const API_KEY = process.env.API_KEY;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";

const api = axios.create({
    baseURL: "https://v3.football.api-sports.io",
    headers: {
        "x-apisports-key": API_KEY
    }
});

// Copy of fetchOdds from dailyUpdateService.js
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
                .filter(m => m.name === "Match Winner")
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
        console.log(`⚠ Odds not available for ${fixtureId}: ${err.message}`);
        return [];
    }
}

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // Find today's FA Cup fixtures (League 45)
        // We can just find all FA Cup fixtures with empty odds to be safe, or just today's.
        // Let's do today's to be fast.
        const today = new Date().toISOString().split('T')[0];
        console.log(`🔎 Finding FA Cup fixtures for ${today} without odds...`);

        const fixtures = await Fixture.find({
            "fixture.league.id": 45,
            "fixture.fixture.date": { $regex: today },
        });

        console.log(`Found ${fixtures.length} fixtures.`);

        for (const f of fixtures) {
            if (f.odds && f.odds.length > 0) {
                console.log(`Skipping ${f.fixture.id} (already has odds)`);
                continue;
            }

            console.log(`🎲 Fetching odds for ${f.fixture.teams.home.name} vs ${f.fixture.teams.away.name} (${f.fixtureId})...`);
            const odds = await fetchOdds(f.fixtureId);

            if (odds.length > 0) {
                f.odds = odds;
                // Also fetch predictions if we want, but let's stick to odds to fix visibility
                await f.save();
                console.log(`   ✅ Saved odds.`);
            } else {
                console.log(`   ⚠️ No odds found API side.`);
            }
        }

        console.log("🎉 Done enrichment.");
        process.exit(0);

    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
}

run();
