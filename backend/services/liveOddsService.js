import axios from "axios";
import Fixture from "../models/Fixture.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

// Poll every 3 minutes
const POLL_INTERVAL = 3 * 60 * 1000;

export async function pollLiveOdds() {
    try {
        console.log("📈 Live Odds Poller: Fetching odds for LIVE matches...");

        // 1. Find matches in DB that are CURRENTLY LIVE
        const LIVE_STATUSES = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"];

        const liveMatches = await Fixture.find({
            "fixture.fixture.status.short": { $in: LIVE_STATUSES }
        }).select("fixtureId fixture.teams");

        if (liveMatches.length === 0) {
            return;
        }

        console.log(`   🎯 Found ${liveMatches.length} Live matches for odds polling. Fetching...`);

        // We have to fetch ODDS individually or in very small specific params, 
        // /odds/live supports "fixture" or "league". Better to loop individually with delay.
        for (const match of liveMatches) {
            try {
                const res = await axios.get(`${BASE_URL}/odds/live`, {
                    params: { fixture: match.fixtureId },
                    headers: { "x-apisports-key": API_KEY }
                });

                const oddsData = res.data.response?.[0];

                if (oddsData && oddsData.odds && oddsData.odds.length > 0) {
                    await Fixture.updateOne(
                        { fixtureId: match.fixtureId },
                        {
                            $set: {
                                liveOdds: [oddsData], // Store in an array to mimic pre-match odds structure
                                lastOddsUpdate: new Date()
                            }
                        }
                    );
                    // console.log(`      ✅ Live Odds updated: ${match.fixture.teams.home.name}`);
                }
            } catch (innerErr) {
                console.error(`      ⚠ Failed live odds for ${match.fixtureId}:`, innerErr.message);
            }

            // Delay 1 second between requests so we don't smash the API limit per minute
            await new Promise(r => setTimeout(r, 1000));
        }

        console.log("      ✅ Live Odds Polling Cycle Complete.");

    } catch (err) {
        console.error("❌ Live Odds Poller Error:", err.message);
    }
}

export function startLiveOddsPoller() {
    console.log(`🚀 Live Odds Poller Started (Every ${POLL_INTERVAL / 60000} mins)`);
    // Delay first run to avoid overlapping with scores start
    setTimeout(pollLiveOdds, 30000);
    setInterval(pollLiveOdds, POLL_INTERVAL);
}
