import { updateStandings } from "./fetch_standings.js";

// Polling interval: 24 hours
const POLLING_INTERVAL = 24 * 60 * 60 * 1000;

export async function pollDailyStandings() {
    try {
        console.log("🏆 Standings Poller: Starting daily update for ALL saved leagues...");

        // Simply update all standings without filtering for active matches
        await updateStandings(false);

    } catch (err) {
        console.error("❌ Standings Poller Error:", err.message);
    }
}

export function startStandingsPoller() {
    console.log(`🚀 Standings Poller Started (Every ${POLLING_INTERVAL / 60000 / 60} hours)`);

    // Initial check
    pollDailyStandings();

    setInterval(pollDailyStandings, POLLING_INTERVAL);
}
