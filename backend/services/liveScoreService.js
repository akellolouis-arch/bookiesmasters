import axios from "axios";
import Fixture from "../models/Fixture.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

// Poll every 2 minutes
const POLL_INTERVAL = 2 * 60 * 1000;

export async function pollLiveScores() {
    try {
        console.log("⚡ Live Score Poller: Fetching updates for LIVE matches...");

        // 1. Find matches in DB that are CURRENTLY LIVE (or stuck Live)
        const LIVE_STATUSES = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"];

        const liveMatches = await Fixture.find({
            "fixture.fixture.status.short": { $in: LIVE_STATUSES }
        }).select("fixtureId fixture.teams");

        if (liveMatches.length === 0) {
            // console.log("   ℹ️ No matches are currently LIVE.");
            return;
        }

        console.log(`   🎯 Found ${liveMatches.length} Live matches. Fetching updates...`);

        // Get up to 20 IDs at a time to comply with API limits (batching)
        const BATCH_SIZE = 20;
        let recoveryFixtures = [];

        for (let i = 0; i < liveMatches.length; i += BATCH_SIZE) {
            const batch = liveMatches.slice(i, i + BATCH_SIZE);
            const ids = batch.map(m => m.fixtureId).join("-");

            const res = await axios.get(`${BASE_URL}/fixtures`, {
                params: { ids: ids },
                headers: { "x-apisports-key": API_KEY }
            });

            if (res.data.response) {
                recoveryFixtures = recoveryFixtures.concat(res.data.response);
            }

            // Small delay between batches to respect rate limits
            if (i + BATCH_SIZE < liveMatches.length) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        // 3. Prepare Bulk Updates
        const bulkOps = recoveryFixtures.map((match) => ({
            updateOne: {
                filter: { fixtureId: match.fixture.id },
                update: {
                    $set: {
                        "fixture.fixture.status": match.fixture.status,
                        "fixture.goals": match.goals,
                        "fixture.score": match.score,
                        "status": match.fixture.status.short, // redundant cache field
                        "fixture.events": match.events,
                        "livescore": match.score,
                        "lastLiveUpdate": new Date()
                    }
                }
            }
        }));

        if (bulkOps.length > 0) {
            const result = await Fixture.bulkWrite(bulkOps, { ordered: false });
            console.log(`      ✅ Live Updates Saved! Modified: ${result.modifiedCount}`);
        }

    } catch (err) {
        console.error("❌ Live Score Poller Error:", err.message);
    }
}

export function startLiveService() {
    console.log(`🚀 Live Score & Events Poller Started (Every ${POLL_INTERVAL / 60000} mins)`);
    // Run immediately
    pollLiveScores();
    setInterval(pollLiveScores, POLL_INTERVAL);
}
