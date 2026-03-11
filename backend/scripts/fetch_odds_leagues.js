import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import League from "../models/League.js";

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
        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");

        console.log("🌍 Fetching ALL leagues from API-Football...");
        const res = await api.get("/leagues");

        if (res.data.errors && Object.keys(res.data.errors).length > 0) {
            console.error("❌ API Error:", res.data.errors);
            process.exit(1);
        }

        const allLeagues = res.data.response || [];
        console.log(`📊 Found ${allLeagues.length} total leagues in the API.`);

        const currentYear = new Date().getFullYear();
        let savedCount = 0;
        let skippedCount = 0;

        console.log(`🔍 Filtering for leagues that support odds data in the ${currentYear} season...`);

        for (const l of allLeagues) {
            // Find the current or most recent season
            const latestSeason = l.seasons.find(s => s.year === currentYear) || l.seasons[l.seasons.length - 1];

            // Check if this latest season explicitly has BOTH odds coverage AND live event coverage
            const hasOdds = latestSeason && latestSeason.coverage && latestSeason.coverage.odds === true;
            const hasLiveScores = latestSeason && latestSeason.coverage && latestSeason.coverage.fixtures && latestSeason.coverage.fixtures.events === true;

            if (hasOdds && hasLiveScores) {
                // Save it to MongoDB
                await League.findOneAndUpdate(
                    { "league.id": l.league.id },
                    {
                        league: {
                            id: l.league.id,
                            name: l.league.name,
                            type: l.league.type,
                            logo: l.league.logo
                        },
                        country: {
                            name: l.country.name,
                            code: l.country.code,
                            flag: l.country.flag
                        },
                        seasons: l.seasons, // Save full season array to match schema
                        active: true,
                        odds: true
                    },
                    { upsert: true, new: true }
                );
                savedCount++;
            } else {
                // If the league is already in our DB but shouldn't be anymore (e.g. no live scores), delete it.
                await League.deleteOne({ "league.id": l.league.id });
                skippedCount++;
            }
        }

        console.log(`\n🎉 Import Complete!`);
        console.log(`✅ Saved/Updated: ${savedCount} leagues that support BOTH odds and live scores.`);
        console.log(`⏭️ Skipped/Removed: ${skippedCount} leagues that DO NOT support both.`);

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
