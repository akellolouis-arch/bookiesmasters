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
        console.log("⚡ Live Score Poller: Fetching global LIVE matches...");

        // 1. Fetch ALL live matches in the world right now from API (1 request, hugely efficient)
        const res = await axios.get(`${BASE_URL}/fixtures`, {
            params: { live: "all" },
            headers: { "x-apisports-key": API_KEY }
        });

        const apiFixtures = res.data.response || [];
        const apiLiveIds = apiFixtures.map(f => f.fixture.id);

        if (apiFixtures.length === 0) {
            // console.log("   ℹ️ No matches are currently LIVE in the world.");
            return;
        }

        console.log(`   🎯 API reports ${apiFixtures.length} active live matches... mapping to database.`);

        // 2. Build the bulk update operations for everything currently live
        const bulkOps = apiFixtures.map((match) => ({
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

        // 3. Find matches that WERE live in our DB, but just finished (dropped off live=all)
        const LIVE_STATUSES = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"];
        const localLiveMatches = await Fixture.find({
            "fixture.fixture.status.short": { $in: LIVE_STATUSES }
        }).select("fixtureId");

        const localLiveIds = localLiveMatches.map(m => m.fixtureId);
        const finishedIds = localLiveIds.filter(id => !apiLiveIds.includes(id));

        if (finishedIds.length > 0) {
            console.log(`   🏁 Found ${finishedIds.length} matches that just finished. Fetching final scores...`);

            // Chunk IDs into groups of 20 to respect API URL limits
            const BATCH_SIZE = 20;
            for (let i = 0; i < finishedIds.length; i += BATCH_SIZE) {
                const batchIds = finishedIds.slice(i, i + BATCH_SIZE).join("-");

                const finishRes = await axios.get(`${BASE_URL}/fixtures`, {
                    params: { ids: batchIds },
                    headers: { "x-apisports-key": API_KEY }
                });

                const finalFixtures = finishRes.data.response || [];

                finalFixtures.forEach(match => {
                    bulkOps.push({
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
                    });
                });

                if (i + BATCH_SIZE < finishedIds.length) {
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        }

        // 4. Execute the Bulk Update (Upsert is strictly false to prevent garbage fixtures)
        if (bulkOps.length > 0) {
            const result = await Fixture.bulkWrite(bulkOps, { ordered: false });
            console.log(`      ✅ Live/Finished Updates Saved! Modified: ${result.modifiedCount}`);
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
