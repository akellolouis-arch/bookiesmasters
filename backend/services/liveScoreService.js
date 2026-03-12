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

export async function pollLiveScores() {
    try {
        console.log("⚡ Live Score Poller: Checking for active or impending matches...");

        // --- OPTIMIZATION: Only poll if we have matches LIVE right now, OR starting in the next 5 mins
        const now = new Date();
        const fiveMinsFromNow = new Date(now.getTime() + 5 * 60 * 1000);

        const LIVE_STATUSES = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"];

        // Query our DB: Are any of OUR saved matches currently live, OR starting in the next 5 mins?
        const activeOrImpendingMatches = await Fixture.find({
            $or: [
                { "fixture.fixture.status.short": { $in: LIVE_STATUSES } },
                {
                    "fixture.fixture.status.short": "NS",
                    "fixture.fixture.date": { $lte: fiveMinsFromNow.toISOString() }
                }
            ]
        }).select("fixtureId").lean();

        if (activeOrImpendingMatches.length === 0) {
            console.log("   🛌 No local matches live or starting within 5 mins. Sleeping...");
            return;
        }

        console.log(`   🔥 Found ${activeOrImpendingMatches.length} local matches active/starting! Polling API...`);

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
        const bulkOps = apiFixtures.map((match) => {
            // OPTIMIZATION: User requested ONLY goal events and NO assist provider.
            const goalEventsOnly = match.events
                ? match.events
                    .filter(e => e.type === "Goal")
                    .map(e => ({
                        time: e.time,
                        team: e.team,
                        player: e.player,
                        type: e.type,
                        detail: e.detail,
                        comments: e.comments
                        // 'assist' is intentionally omitted here
                    }))
                : [];

            return {
                updateOne: {
                    filter: { fixtureId: match.fixture.id },
                    update: {
                        $set: {
                            "fixture.fixture.status": match.fixture.status,
                            "fixture.goals": match.goals,
                            "fixture.score": match.score,
                            "status": match.fixture.status.short, // redundant cache field
                            "fixture.events": goalEventsOnly, // Save ONLY goals without assists
                            "livescore": match.score,
                            "lastLiveUpdate": new Date()
                        }
                    }
                }
            };
        });

        // 3. Find matches that WERE live in our DB, but just finished (dropped off live=all)
        // We already have `activeOrImpendingMatches`, let's just filter it to those that WERE live.
        const localLiveMatches = await Fixture.find({
            "fixture.fixture.status.short": { $in: LIVE_STATUSES }
        }).select("fixtureId").lean();

        const localLiveIds = localLiveMatches.map(m => m.fixtureId);
        let finishedIds = localLiveIds.filter(id => !apiLiveIds.includes(id));

        // --- STUCK MATCH DETECTOR ---
        // Find matches that are still "NS" in our DB, but kickoff was > 120 mins ago (they must be finished)
        const twoHoursAgo = new Date(now.getTime() - 120 * 60 * 1000);
        const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000); // Prevent querying ancient matches

        const stuckMatches = await Fixture.find({
            "fixture.fixture.status.short": "NS",
            "fixture.fixture.date": {
                $lte: twoHoursAgo.toISOString(),
                $gte: fortyEightHoursAgo.toISOString()
            }
        }).select("fixtureId").lean();

        if (stuckMatches.length > 0) {
            console.log(`   🚨 Detected ${stuckMatches.length} matches stuck on 'NS' past 120 mins. Force-fetching final score.`);
            const stuckIds = stuckMatches.map(m => m.fixtureId);
            // Add stuck IDs to the finished IDs list so they are explicitly fetched
            finishedIds = [...new Set([...finishedIds, ...stuckIds])];
        }

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
                    const goalEventsOnly = match.events
                        ? match.events
                            .filter(e => e.type === "Goal")
                            .map(e => ({
                                time: e.time,
                                team: e.team,
                                player: e.player,
                                type: e.type,
                                detail: e.detail,
                                comments: e.comments
                                // 'assist' is intentionally omitted here
                            }))
                        : [];

                    bulkOps.push({
                        updateOne: {
                            filter: { fixtureId: match.fixture.id },
                            update: {
                                $set: {
                                    "fixture.fixture.status": match.fixture.status,
                                    "fixture.goals": match.goals,
                                    "fixture.score": match.score,
                                    "status": match.fixture.status.short,
                                    "fixture.events": goalEventsOnly,
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

export async function startLiveService() {
    console.log(`🚀 Live Score & Events Poller Started (Every ${POLL_INTERVAL / 60000} mins)`);

    // Recursive loop
    while (true) {
        try {
            await pollLiveScores();
            // Sleep for the interval before running again
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
        } catch (err) {
            console.error("❌ Poller crashed, restarting in 10s...", err.message);
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    }
}
