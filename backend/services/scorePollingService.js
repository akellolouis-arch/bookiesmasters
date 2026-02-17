import axios from "axios";
import Fixture from "../models/Fixture.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

// Poll every 5 minutes
const POLL_INTERVAL = 5 * 60 * 1000;

export async function pollActiveMatchScores() {
    try {
        console.log("⚽ Score Poller: Checking for active/recent matches...");

        const now = new Date();
        const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);

        // Terminating Statuses (We don't need to poll these)
        const FINISHED_STATUSES = ["FT", "AET", "PEN", "PST", "CANC", "ABD", "AWD", "WO"];

        // Query: Matches that started in the last 4 hours AND are not finished
        const targets = await Fixture.find({
            "fixture.fixture.date": { $gte: fourHoursAgo.toISOString(), $lte: now.toISOString() },
            "fixture.fixture.status.short": { $nin: FINISHED_STATUSES }
        }).select("fixtureId");

        if (targets.length === 0) {
            // console.log("   ✅ No active matches to poll.");
            return;
        }

        console.log(`   🎯 Found ${targets.length} active matches. syncing scores...`);

        // Batch IDs (max 20 per call for safety, though API allows more)
        const batchSize = 10;
        for (let i = 0; i < targets.length; i += batchSize) {
            const batch = targets.slice(i, i + batchSize);
            const ids = batch.map(f => f.fixtureId).join("-");

            try {
                const res = await axios.get(`${BASE_URL}/fixtures`, {
                    params: { ids: ids },
                    headers: { "x-apisports-key": API_KEY }
                });

                const updates = res.data.response;
                if (!updates) continue;

                for (const update of updates) {
                    // Update Status & Score in DB
                    await Fixture.updateOne(
                        { fixtureId: update.fixture.id },
                        {
                            $set: {
                                "fixture.fixture.status": update.fixture.status,
                                "fixture.goals": update.goals,
                                "fixture.score": update.score,
                                // Also update root-level fields if we use them for sorting/filtering
                                "status": update.fixture.status.short
                            }
                        }
                    );
                }
                console.log(`      ✅ Updated batch of ${updates.length} scores.`);

            } catch (err) {
                console.error(`      ❌ Error fetching batch:`, err.message);
            }

            // Tiny delay between batches
            await new Promise(r => setTimeout(r, 1000));
        }

    } catch (err) {
        console.error("❌ Score Poller Error:", err.message);
    }
}

export function startScorePoller() {
    console.log(`🚀 Score Poller Started (Every ${POLL_INTERVAL / 60000} mins)`);
    pollActiveMatchScores(); // Run immediately
    setInterval(pollActiveMatchScores, POLL_INTERVAL);
}
