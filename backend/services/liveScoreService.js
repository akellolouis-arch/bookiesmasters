import axios from "axios";
import Fixture from "../models/Fixture.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

// Cache to prevent flood of logs
let lastLogTime = 0;

export async function pollLiveScores() {
    try {
        // STEP 1: Get currently LIVE matches from our DB
        // We track what we THINK is live.
        const LIVE_STATUSES = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"];
        const localLiveMatches = await Fixture.find({
            "fixture.fixture.status.short": { $in: LIVE_STATUSES }
        }).select("fixtureId");

        const localLiveIds = new Set(localLiveMatches.map(f => f.fixtureId));

        // STEP 2: Fetch actual LIVE matches from API
        const response = await axios.get(`${BASE_URL}/fixtures`, {
            params: { live: "all" },
            headers: { "x-apisports-key": API_KEY, "Accept-Encoding": "identity" } // encoding fix sometimes needed
        });
        const apiLiveFixtures = response.data.response;
        const apiLiveIds = new Set(apiLiveFixtures.map(f => f.fixture.id));

        // STEP 3: Detect DISAPPEARED matches (In DB but NOT in API)
        // These are likely finished (FT) or interrupted
        const disappearedIds = [...localLiveIds].filter(id => !apiLiveIds.has(id));

        let recoveryFixtures = [];
        if (disappearedIds.length > 0) {
            console.log(`🔎 [LivePoll] Detected ${disappearedIds.length} matches disappeared (finished?). Verifying...`);

            // Fetch these specific ID(s) to get their new status (FT)
            const idsStr = disappearedIds.join("-"); // API supports id-id-id
            const recoveryRes = await axios.get(`${BASE_URL}/fixtures`, {
                params: { ids: idsStr },
                headers: { "x-apisports-key": API_KEY }
            });
            recoveryFixtures = recoveryRes.data.response;
        }

        // STEP 4: Merge Lists & Update
        const allUpdates = [...apiLiveFixtures, ...recoveryFixtures];

        if (allUpdates.length === 0) return;

        // Log occasionally
        const now = Date.now();
        if (now - lastLogTime > 60000 * 5) {
            console.log(`📡 [LivePoll] Updating ${apiLiveFixtures.length} live + ${recoveryFixtures.length} finished matches.`);
            lastLogTime = now;
        }

        const bulkOps = allUpdates.map(apiFixture => ({
            updateOne: {
                filter: { fixtureId: apiFixture.fixture.id },
                update: {
                    $set: {
                        "fixture.fixture": apiFixture.fixture,
                        "fixture.goals": apiFixture.goals,
                        "fixture.score": apiFixture.score,
                        "fixture.events": apiFixture.events,
                        "fixture.status": apiFixture.fixture.status,
                        // Update livescore field
                        livescore: {
                            status: apiFixture.fixture.status,
                            goals: apiFixture.goals,
                            score: apiFixture.score
                        },
                        lastLiveUpdate: new Date()
                    }
                }
            }
        }));

        if (bulkOps.length > 0) {
            await Fixture.bulkWrite(bulkOps, { ordered: false });
        }

    } catch (err) {
        console.error("❌ [LivePoll] Error:", err.message);
    }
}

// Start the polling loop (runs every 60 seconds)
export function startLiveService() {
    console.log("🚀 Live Score Service Started (Polling every 60s)");

    // Run immediately on start
    pollLiveScores();

    // Then interval
    setInterval(pollLiveScores, 5000);
}
