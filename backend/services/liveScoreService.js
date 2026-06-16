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

// Poller interval 
export async function pollLiveScores() {
    try {
        console.log("⚡ Live Score Poller: Checking for active or impending matches...");

        // --- OPTIMIZATION: Only poll if we have matches LIVE right now, OR starting in the next 5 mins
        const now = new Date();
        const fiveMinsFromNow = new Date(now.getTime() + 5 * 60 * 1000);
        const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        const twoHoursAgo = new Date(now.getTime() - 120 * 60 * 1000);
        const twoHoursTenAgo = new Date(now.getTime() - 130 * 60 * 1000);
        const threeHoursAgo = new Date(now.getTime() - 180 * 60 * 1000);
        const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

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
            console.log("   🛌 No local matches live or starting within 5 mins. Running overdue reconciliation only...");
        } else {
            console.log(`   🔥 Found ${activeOrImpendingMatches.length} local matches active/starting! Polling API...`);
        }

        let apiFixtures = [];
        let apiLiveIds = [];
        if (activeOrImpendingMatches.length > 0) {
            // 1. Fetch ALL live matches in the world right now from API (1 request, hugely efficient)
            const res = await axios.get(`${BASE_URL}/fixtures`, {
                params: { live: "all" },
                headers: { "x-apisports-key": API_KEY }
            });
            apiFixtures = res.data.response || [];
            apiLiveIds = apiFixtures.map(f => f.fixture.id);
        }

        if (apiFixtures.length === 0) {
            console.log("   ℹ️ API reports no LIVE matches globally. Running stuck-match reconciliation only...");
        } else {
            console.log(`   🎯 API reports ${apiFixtures.length} active live matches... mapping to database.`);
        }

        // 2. Build the bulk update operations for everything currently live
        const bulkOps = apiFixtures.map((match) => {
            return {
                updateOne: {
                    filter: { fixtureId: match.fixture.id },
                    update: {
                        $set: {
                            "fixture.fixture.status": match.fixture.status,
                            "fixture.goals": match.goals,
                            "fixture.score": match.score,
                            "status": match.fixture.status.short, // redundant cache field
                            "livescore": match.score,
                            "lastLiveUpdate": new Date()
                        }
                    }
                }
            };
        });

        const liveBulkOpIds = new Set(apiFixtures.map((m) => m.fixture.id));

        // 2b. API `live=all` often omits lower tiers (e.g. Argentina Primera C). Those stay `NS` in DB
        // so the UI shows kickoff time instead of live minutes. Refresh by fixture id.
        const PAST_KICKOFF_GRACE_MS = 2 * 60 * 1000;
        const impendingIdList = activeOrImpendingMatches.map((m) => m.fixtureId);
        if (impendingIdList.length > 0) {
            const pastKickoffNs = await Fixture.find({
                fixtureId: { $in: impendingIdList },
                "fixture.fixture.status.short": "NS",
                "fixture.fixture.date": {
                    $lt: new Date(now.getTime() - PAST_KICKOFF_GRACE_MS).toISOString(),
                    $gte: fortyEightHoursAgo.toISOString()
                }
            })
                .select("fixtureId")
                .lean();

            const refetchNsIds = pastKickoffNs
                .map((d) => d.fixtureId)
                .filter((id) => !liveBulkOpIds.has(id));

            if (refetchNsIds.length > 0) {
                console.log(
                    `   🔄 ${refetchNsIds.length} past-kickoff NS not in live=all — fetching by id (lower-tier / missing from live feed)...`
                );
                const REFETCH_BATCH = 20;
                for (let i = 0; i < refetchNsIds.length; i += REFETCH_BATCH) {
                    const batchIds = refetchNsIds.slice(i, i + REFETCH_BATCH).join("-");
                    const refreshRes = await axios.get(`${BASE_URL}/fixtures`, {
                        params: { ids: batchIds },
                        headers: { "x-apisports-key": API_KEY }
                    });
                    const rows = refreshRes.data?.response || [];
                    rows.forEach((match) => {
                        bulkOps.push({
                            updateOne: {
                                filter: { fixtureId: match.fixture.id },
                                update: {
                                    $set: {
                                        "fixture.fixture.status": match.fixture.status,
                                        "fixture.goals": match.goals,
                                        "fixture.score": match.score,
                                        "status": match.fixture.status.short,
                                        "livescore": match.score,
                                        "lastLiveUpdate": new Date()
                                    }
                                }
                            }
                        });
                    });
                    if (i + REFETCH_BATCH < refetchNsIds.length) {
                        await new Promise((r) => setTimeout(r, 500));
                    }
                }
            }
        }

        // 3. Find matches that WERE live in our DB, but just finished (dropped off live=all)
        // We already have `activeOrImpendingMatches`, let's just filter it to those that WERE live.
        const localLiveMatches = await Fixture.find({
            "fixture.fixture.status.short": { $in: LIVE_STATUSES }
        }).select("fixtureId").lean();

        const localLiveIds = localLiveMatches.map(m => m.fixtureId);
        let finishedIds = localLiveIds.filter(id => !apiLiveIds.includes(id));

        // --- STUCK MATCH DETECTOR ---
        // 1) Find matches that are still "NS" in our DB, but kickoff was > 120 mins ago (they must be finished)
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

        // 2) Matches that are still LIVE/2H at 90' long after kickoff
        // Some fixtures get stuck at 90' on the API. If kickoff was > 130 mins ago, force-fetch them as finished.
        const stuckLiveMatches = await Fixture.find({
            "fixture.fixture.status.short": { $in: LIVE_STATUSES },
            "fixture.fixture.status.elapsed": { $gte: 90 },
            "fixture.fixture.date": {
                $lte: twoHoursTenAgo.toISOString(),
                $gte: fortyEightHoursAgo.toISOString()
            }
        }).select("fixtureId").lean();

        if (stuckLiveMatches.length > 0) {
            console.log(`   🚨 Detected ${stuckLiveMatches.length} matches stuck LIVE at 90'+. Force-fetching final score.`);
            const stuckLiveIds = stuckLiveMatches.map(m => m.fixtureId);
            finishedIds = [...new Set([...finishedIds, ...stuckLiveIds])];
        }

        // 2.5) Matches stuck at LIVE/HT for over 3 hours
        // Sometimes lower-tier matches (e.g. Lebanon) drop off the API at HT and elapsed never hits 90.
        const stuckAnyLiveMatches = await Fixture.find({
            "fixture.fixture.status.short": { $in: LIVE_STATUSES },
            "fixture.fixture.date": {
                $lte: threeHoursAgo.toISOString(),
                $gte: fortyEightHoursAgo.toISOString()
            }
        }).select("fixtureId").lean();

        if (stuckAnyLiveMatches.length > 0) {
            console.log(`   🚨 Detected ${stuckAnyLiveMatches.length} matches stuck LIVE past 3 hours. Force-fetching final score.`);
            const stuckAnyIds = stuckAnyLiveMatches.map(m => m.fixtureId);
            finishedIds = [...new Set([...finishedIds, ...stuckAnyIds])];
        }


        // 3) Hard safety finalizer:
        // Any non-finished fixture older than 6 hours should be force-checked once more.
        const nonFinishedStatuses = ["NS", ...LIVE_STATUSES];
        const staleRecentMatches = await Fixture.find({
            "fixture.fixture.status.short": { $in: nonFinishedStatuses },
            "fixture.fixture.date": {
                $lte: sixHoursAgo.toISOString(),
                $gte: fortyEightHoursAgo.toISOString()
            }
        }).select("fixtureId").lean();

        if (staleRecentMatches.length > 0) {
            console.log(`   🚨 Detected ${staleRecentMatches.length} stale non-finished matches older than 6h. Force-fetching final score.`);
            const staleIds = staleRecentMatches.map(m => m.fixtureId);
            finishedIds = [...new Set([...finishedIds, ...staleIds])];
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
                    // If API still reports a LIVE status long after kickoff, force-close it.
                    const kickoff = new Date(match?.fixture?.date);
                    const isVeryLate = kickoff.toISOString() <= twoHoursTenAgo.toISOString();
                    const isExtremelyLate = kickoff.toISOString() <= threeHoursAgo.toISOString();
                    const isStillLive = LIVE_STATUSES.includes(match?.fixture?.status?.short);
                    if (isVeryLate && isStillLive && ((match?.fixture?.status?.elapsed ?? 0) >= 90 || isExtremelyLate)) {
                        match.fixture.status = {
                            ...match.fixture.status,
                            long: "Match Finished",
                            short: "FT",
                            elapsed: 90,
                            extra: null
                        };
                        // If fulltime score is missing but goals exist, fill it for UI.
                        if (match?.score?.fulltime && (match.score.fulltime.home == null || match.score.fulltime.away == null)) {
                            match.score.fulltime = { home: match.goals?.home ?? null, away: match.goals?.away ?? null };
                        }
                    }

                    bulkOps.push({
                        updateOne: {
                            filter: { fixtureId: match.fixture.id },
                            update: {
                                $set: {
                                    "fixture.fixture.status": match.fixture.status,
                                    "fixture.goals": match.goals,
                                    "fixture.score": match.score,
                                    "status": match.fixture.status.short,
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
