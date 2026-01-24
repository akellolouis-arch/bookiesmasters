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
        // STEP 1: Smart-Check Database
        // Do we even HAVE any matches that *should* be live right now?
        // Criteria:
        // 1. Status is already LIVE (1H, 2H, etc.)
        // 2. Status is NS (Not Started) but StartTime is NOW or in the past (late start?)
        // 3. Status is NS and StartTime is in the next 10 mins (about to start)
        const now = new Date();
        const tenMinsFromNow = new Date(now.getTime() + 10 * 60000);

        const possibleLiveMatches = await Fixture.countDocuments({
            $or: [
                { "fixture.fixture.status.short": { $in: ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"] } },
                {
                    "fixture.fixture.status.short": "NS",
                    "fixture.fixture.date": { $lte: tenMinsFromNow.toISOString() }
                }
            ]
        });

        if (possibleLiveMatches === 0) {
            // console.log("💤 [LivePoll] No active matches scheduled. Sleeping...");
            return;
        }

        // STEP 2: Proceed to Fetch
        // Get currently LIVE matches from our DB tracking
        const LIVE_STATUSES = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"];
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

            // SAFETY CHECK:
            // If we asked for specific IDs but the API returned NOTHING for them, 
            // it means they are effectively dead/gone. We must assume they are Finished (FT) 
            // to stop the "Zombie Loop" of trying to fetch them forever.
            const foundIds = new Set(recoveryFixtures.map(f => f.fixture.id));
            const stillMissingIds = disappearedIds.filter(id => !foundIds.has(id));

            if (stillMissingIds.length > 0) {
                console.log(`💀 [LivePoll] Force-closing ${stillMissingIds.length} zombie matches that vanished from API.`);

                // Force update these to FT in database
                await Fixture.updateMany(
                    { fixtureId: { $in: stillMissingIds } },
                    {
                        $set: {
                            "fixture.fixture.status.short": "FT",
                            "fixture.fixture.status.long": "Match Finished (Forced)",
                            "livescore.status.short": "FT",
                            lastLiveUpdate: new Date()
                        }
                    }
                );
            }
        }

        // STEP 4: Merge Lists & Update
        const allUpdates = [...apiLiveFixtures, ...recoveryFixtures];

        if (allUpdates.length > 0) {
            // Log occasionally (only when active)
            const timestamp = Date.now();
            if (timestamp - lastLogTime > 60000 * 5) {
                console.log(`📡 [LivePoll] Active! Updating ${apiLiveFixtures.length} live + ${recoveryFixtures.length} finished matches.`);
                lastLogTime = timestamp;
            }

            const bulkOps = allUpdates.map(apiFixture => {
                const isFinished = ["FT", "AET", "PEN"].includes(apiFixture.fixture.status.short);

                const updateDoc = {
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
                };

                // 🧹 CLEANUP: If match is finished, delete liveOdds
                if (isFinished) {
                    updateDoc.$unset = { liveOdds: 1 };
                }

                return {
                    updateOne: {
                        filter: { fixtureId: apiFixture.fixture.id },
                        update: updateDoc
                    }
                };
            });

            await Fixture.bulkWrite(bulkOps, { ordered: false });
        }

    } catch (err) {
        console.error("❌ [LivePoll] Error:", err.message);
    }
}

// ⚡ LIVE ODDS POLLER (Every 30s)
export async function pollLiveOdds() {
    try {
        // 1. Check if there are any LIVE matches in our DB
        const liveCount = await Fixture.countDocuments({
            "fixture.fixture.status.short": { $in: ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"] }
        });

        if (liveCount === 0) return; // No live matches, save API calls

        // 2. Fetch Live Odds from API (Bookmaker 11 = 1xBet)
        const response = await axios.get(`${BASE_URL}/odds/live`, {
            params: { bookmaker: 11 }, // 1xBet
            headers: { "x-apisports-key": API_KEY }
        });

        const allLiveOdds = response.data.response || [];

        if (allLiveOdds.length === 0) return;

        // 3. Update DB
        const bulkOps = allLiveOdds.map(item => ({
            updateOne: {
                filter: { fixtureId: item.fixture.id },
                update: {
                    $set: {
                        // Store exactly in the same structure as pre-match 'odds' for compatibility
                        liveOdds: [{
                            bookmaker: "1xBet", // Hardcoded for display
                            markets: item.odds.filter(m => m.id === 1 || m.name === "Match Winner").map(m => ({
                                id: 1,
                                name: "Match Winner",
                                values: m.values // API Live Odds structure is already compatible {value: "Home", odd: "1.50"}
                            }))
                        }]
                    }
                }
            }
        }));

        if (bulkOps.length > 0) {
            await Fixture.bulkWrite(bulkOps, { ordered: false });
            // console.log(`⚡ [LiveOdds] Updated odds for ${bulkOps.length} matches.`);
        }

    } catch (err) {
        console.error("❌ [LiveOdds] Error:", err.message);
    }
}

// Start the polling loop
export function startLiveService() {
    console.log("🚀 Live Score Service Started");
    console.log("   👉 Scores: Every 60s");
    console.log("   👉 Odds:   Every 30s");

    // Run immediately
    pollLiveScores();
    pollLiveOdds();

    // Schedule
    setInterval(pollLiveScores, 60000); // 60s for Scores
    setInterval(pollLiveOdds, 30000);   // 30s for Odds
}
