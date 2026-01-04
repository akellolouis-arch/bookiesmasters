import Fixture from "../models/Fixture.js";
import { fetchLineups, fetchInjuries } from "./enrichmentService.js";

// Configuration
const POLLING_INTERVAL = 5 * 60 * 1000; // 5 minutes
const LOOKAHEAD_MINUTES = 30; // Look for games starting in next 30 mins

export async function pollLineupsForUpcoming() {
    try {
        console.log("🕵️ Lineup Poller: Checking for upcoming (or just started) matches...");

        const now = new Date();
        const lookahead = new Date(now.getTime() + LOOKAHEAD_MINUTES * 60000);

        const LIVE_STATUSES = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"];

        // QUERY:
        // 1. (Upcoming in 45m OR Currently Live)
        // 2. AND Lineups are EMPTY
        const query = {
            $and: [
                {
                    $or: [
                        // Future: Starting soon
                        {
                            "fixture.fixture.date": {
                                $gte: now.toISOString(),
                                $lte: lookahead.toISOString()
                            }
                        },
                        // Live: In progress queries (only poll during first 6 mins to catch late lineups)
                        {
                            "fixture.fixture.status.short": { $in: ["1H"] },
                            "fixture.fixture.status.elapsed": { $lte: 6 }
                        }
                    ]
                },
                {
                    $or: [
                        { lineups: { $exists: false } },
                        { lineups: { $size: 0 } },
                        { lineups: null },
                        // Also retry if we have the array but no actual players (API delay)
                        { "lineups.0.startXI": { $exists: false } },
                        { "lineups.0.startXI": { $size: 0 } }
                    ]
                }
            ]
        };

        const targets = await Fixture.find(query).select("fixtureId fixture.fixture.date fixture.teams");

        if (targets.length === 0) {
            // console.log("   ✅ No pending lineups found.");
            return;
        }

        console.log(`   🎯 Found ${targets.length} matches expecting lineups. Fetching...`);

        // Process sequentially to be gentle on API
        for (const f of targets) {
            // Fetch both linepus and injuries
            const [lineups, injuries] = await Promise.all([
                fetchLineups(f.fixtureId),
                fetchInjuries(f.fixtureId)
            ]);

            const updateFields = {};
            if (lineups && lineups.length > 0) updateFields.lineups = lineups;
            if (injuries && injuries.length > 0) updateFields.injuries = injuries;

            if (Object.keys(updateFields).length > 0) {
                await Fixture.updateOne(
                    { _id: f._id },
                    {
                        $set: updateFields,
                        $currentDate: { updatedAt: true }
                    }
                );
                console.log(`      ✅ Saved rich data for ${f.fixture.teams.home.name} vs ${f.fixture.teams.away.name}`);
            } else {
                console.log(`      ⚠️ No lineups/injuries yet for ${f.fixture.teams.home.name} vs ${f.fixture.teams.away.name}`);
            }
        }

    } catch (err) {
        console.error("❌ Lineup Poller Error:", err.message);
    }
}

export function startLineupPoller() {
    console.log(`🚀 Lineup Poller Started (Every ${POLLING_INTERVAL / 60000} mins)`);

    // Initial run
    pollLineupsForUpcoming();

    setInterval(pollLineupsForUpcoming, POLLING_INTERVAL);
}
