import axios from "axios";
import Fixture from "../models/Fixture.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

// Poll every 1 minute
const POLL_INTERVAL = 1 * 60 * 1000;

export async function pollActiveMatchScores() {
    try {
        console.log("⚽ Score Poller: Fetching all matches for TODAY...");

        const now = new Date();
        const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD

        // 1. Fetch ALL matches for today from API-Football
        const res = await axios.get(`${BASE_URL}/fixtures`, {
            params: { date: dateString },
            headers: { "x-apisports-key": API_KEY }
        });

        const allTodayFixtures = res.data.response;
        if (!allTodayFixtures || allTodayFixtures.length === 0) {
            console.log("   ⚠️ No matches found for today (API returned 0).");
            return;
        }

        console.log(`   📡 Received ${allTodayFixtures.length} matches from API. filtering for updates...`);

        // 2. Prepare Bulk Operations
        // We only want to update matches that ALREADY EXIST in our DB.
        // We do NOT want to insert new matches blindly (unless that's desired, but usually we stick to our selected leagues).
        // The most efficient way is to try to update them all. If a fixtureId doesn't exist, it won't trigger an update.

        const bulkOps = allTodayFixtures.map((match) => ({
            updateOne: {
                filter: { fixtureId: match.fixture.id },
                update: {
                    $set: {
                        "fixture.fixture.status": match.fixture.status,
                        "fixture.goals": match.goals,
                        "fixture.score": match.score,
                        "status": match.fixture.status.short,
                        "fixture.events": match.events, // Keep events updated too if provided
                        "livescore": match.score,  // Ensure livescore field is synced
                        "lastLiveUpdate": new Date()
                    }
                }
            }
        }));

        if (bulkOps.length > 0) {
            const result = await Fixture.bulkWrite(bulkOps, { ordered: false });
            console.log(`      ✅ Bulk Update Result: Match output: ${result.matchCount}, Modified: ${result.modifiedCount}`);
        } else {
            console.log("      ℹ️ No bulk operations to perform.");
        }

    } catch (err) {
        console.error("❌ Score Poller Error:", err.message);
    }
}

export function startScorePoller() {
    console.log(`🚀 Score Poller Started (Every ${POLL_INTERVAL / 60000} min)`);
    pollActiveMatchScores(); // Run immediately
    setInterval(pollActiveMatchScores, POLL_INTERVAL);
}
