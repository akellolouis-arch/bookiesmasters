import axios from "axios";
import Fixture from "../models/Fixture.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

export async function pollMatchStatistics() {
    try {
        // 1. Find currently LIVE matches in DB
        const LIVE_STATUSES = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"];
        const liveMatches = await Fixture.find({
            "fixture.fixture.status.short": { $in: LIVE_STATUSES },
            "statsUnavailable": { $ne: true } // Exclude marked matches
        }).select("fixtureId fixture.teams.home.name fixture.teams.away.name fixture.fixture.status.elapsed");

        if (liveMatches.length === 0) return;

        // console.log(`📊 [StatsPoller] Updating stats for ${liveMatches.length} live matches...`);

        // 2. Fetch Stats for specific matches
        // API Limit: 1 request per match.
        // To be safe, we process them one by one or in small parallel batches.

        for (const match of liveMatches) {
            try {
                // Check if we recently updated it? (Optimization for later)

                const res = await axios.get(`${BASE_URL}/fixtures/statistics`, {
                    params: { fixture: match.fixtureId },
                    headers: { "x-apisports-key": API_KEY }
                });

                const statsData = res.data.response; // Array of 2 teams

                if (statsData && statsData.length > 0) {
                    await Fixture.updateOne(
                        { fixtureId: match.fixtureId },
                        { $set: { statistics: statsData } }
                    );
                    // console.log(`   ✅ Stats updated: ${match.fixture.teams.home.name} vs ${match.fixture.teams.away.name}`);
                } else {
                    // If no stats returned, check if we should give up
                    // Give it 15 minutes grace period
                    if (match.fixture.fixture.status.elapsed > 15) {
                        console.log(`   ⛔ No stats available for ${match.fixture.teams.home.name} vs ${match.fixture.teams.away.name} (Elapsed: ${match.fixture.fixture.status.elapsed}'). Stopping poll.`);

                        await Fixture.updateOne(
                            { fixtureId: match.fixtureId },
                            { $set: { statsUnavailable: true } }
                        );
                    }
                }

            } catch (innerErr) {
                console.error(`   ⚠ Failed stats for ${match.fixtureId}:`, innerErr.message);
            }

            // Artificial delay to spread load (e.g. 200ms)
            await new Promise(r => setTimeout(r, 200));
        }

    } catch (err) {
        console.error("❌ [StatsPoller] Error:", err.message);
    }
}

export function startStatsPoller() {
    console.log("🚀 Live Statistics Poller Started (Every 5 mins)");

    // Run immediately
    pollMatchStatistics();

    // Then interval
    setInterval(pollMatchStatistics, 5 * 60 * 1000); // 5 minutes
}
