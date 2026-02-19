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
        const startOfToday = new Date(dateString); // 00:00:00 UTC

        // 1. Fetch ALL matches for today from API-Football
        const res = await axios.get(`${BASE_URL}/fixtures`, {
            params: { date: dateString },
            headers: { "x-apisports-key": API_KEY }
        });

        const allTodayFixtures = res.data.response || [];
        console.log(`   📡 Received ${allTodayFixtures.length} matches for Today (${dateString}).`);

        // 2. RECOVERY: Find "Stuck" Live Matches from Previous Days
        // (Matches that started yesterday but are still marked live in DB, likely crossing midnight)
        const LIVE_STATUSES = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"];

        const stuckMatches = await Fixture.find({
            "fixture.fixture.status.short": { $in: LIVE_STATUSES },
            "fixture.fixture.date": { $lt: startOfToday.toISOString() }
        }).select("fixtureId");

        let recoveryFixtures = [];
        if (stuckMatches.length > 0) {
            console.log(`   🚑 Found ${stuckMatches.length} stuck matches from previous days. Fetching updates...`);
            const ids = stuckMatches.map(m => m.fixtureId).join("-");

            try {
                const recoveryRes = await axios.get(`${BASE_URL}/fixtures`, {
                    params: { ids: ids },
                    headers: { "x-apisports-key": API_KEY }
                });
                recoveryFixtures = recoveryRes.data.response || [];
                console.log(`      ✅ Fetched ${recoveryFixtures.length} recovery updates.`);
            } catch (err) {
                console.error(`      ❌ Error fetching recovery matches:`, err.message);
            }
        }

        // 3. Merge & Update
        // Combine today's matches + recovery matches
        const allUpdates = [...allTodayFixtures, ...recoveryFixtures];

        if (allUpdates.length === 0) {
            console.log("   ℹ️ No updates to process.");
            return;
        }

        const bulkOps = allUpdates.map((match) => ({
            updateOne: {
                filter: { fixtureId: match.fixture.id },
                update: {
                    $set: {
                        "fixture.fixture.status": match.fixture.status,
                        "fixture.goals": match.goals,
                        "fixture.score": match.score,
                        "status": match.fixture.status.short,
                        "fixture.events": match.events,
                        "livescore": match.score,
                        "lastLiveUpdate": new Date()
                    }
                }
            }
        }));

        if (bulkOps.length > 0) {
            const result = await Fixture.bulkWrite(bulkOps, { ordered: false });
            console.log(`      ✅ Bulk Update Result: Match output: ${result.matchCount}, Modified: ${result.modifiedCount}`);
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
