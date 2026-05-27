import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({
  path: path.resolve(__dirname, "../../.env.local"),
  override: true,
});

import League from "../models/League.js";

const API_KEY = process.env.API_KEY;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";

/** Match server.js — avoids TLS/internal_error on Node 20+ ↔ Atlas in some environments */
const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 45_000,
  autoSelectFamily: false,
  retryWrites: true,
};

const api = axios.create({
    baseURL: "https://v3.football.api-sports.io",
    headers: {
        "x-apisports-key": API_KEY
    }
});

async function run() {
    try {
        if (!API_KEY) {
            console.error("❌ API_KEY is not set (backend/.env or .env.local)");
            process.exit(1);
        }
        if (!process.env.MONGO_URI) {
            console.error("❌ MONGO_URI is not set (backend/.env or root .env.local)");
            process.exit(1);
        }

        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI, MONGO_OPTIONS);
        console.log("✅ Connected to MongoDB");

        console.log("🧹 Deleting all saved leagues...");
        await League.deleteMany({});
        console.log("✅ All leagues deleted.");

        console.log("🌍 Fetching ALL leagues from API-Football...");
        const res = await api.get("/leagues");

        if (res.data.errors && Object.keys(res.data.errors).length > 0) {
            console.error("❌ API Error:", res.data.errors);
            process.exit(1);
        }

        const allLeagues = res.data.response || [];
        console.log(`📊 Found ${allLeagues.length} total leagues in the API.`);

        let savedCount = 0;
        let skippedCount = 0;

        console.log(`🔍 Filtering for leagues whose CURRENT season supports predictions + odds...`);

        for (const l of allLeagues) {
            const currentSeason = Array.isArray(l.seasons) ? l.seasons.find(s => s.current === true) : null;
            const hasPredictions = currentSeason?.coverage?.predictions === true;
            const hasOdds = currentSeason?.coverage?.odds === true;

            if (!currentSeason || !hasPredictions || !hasOdds) {
                skippedCount++;
                continue;
            }

            await League.create({
                league: l.league,
                country: l.country,
                seasons: l.seasons,
                active: true,
                odds: true,
                predictions: true,
                season: currentSeason.year
            });

            savedCount++;
        }

        console.log(`\n🎉 Import Complete!`);
        console.log(`✅ Saved: ${savedCount} leagues that support BOTH odds and predictions in current season.`);
        console.log(`⏭️ Skipped: ${skippedCount} leagues that do not.`);

        process.exit(0);
    } catch (err) {
        console.error("❌ Fatal Error:", err.message);
        if (err.response) {
            console.error("API Response Data:", err.response.data);
        }
        process.exit(1);
    }
}

run();
