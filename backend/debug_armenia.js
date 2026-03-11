import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from backend directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.error("❌ ERROR: Missing API_KEY in .env");
    process.exit(1);
}

const api = axios.create({
    baseURL: "https://v3.football.api-sports.io",
    headers: { "x-apisports-key": API_KEY }
});

async function run() {
    try {
        console.log("🔍 Fetching Armenian leagues from API-Football...\n");

        const res = await api.get("/leagues", {
            params: { search: "Armenia" } // Search specifically for Armenia
        });

        const leagues = res.data.response || [];

        if (leagues.length === 0) {
            console.log("No leagues found for Armenia.");
            return;
        }

        // Loop through all Armenian leagues found
        for (const l of leagues) {
            // Find the season where current === true
            const currentSeason = l.seasons.find(s => s.current === true);

            if (currentSeason) {
                console.log(`=================================================`);
                console.log(`🏆 LEAGUE: ${l.league.name} (ID: ${l.league.id})`);
                console.log(`=================================================\n`);
                console.log("Here is the exact 'current: true' season object:\n");

                // Print the entire season object so you can see exactly what 'coverage' looks like
                console.log(JSON.stringify(currentSeason, null, 2));
                console.log("\n");
            } else {
                console.log(`⚠ League ${l.league.name} does not have a 'current' season.\n`);
            }
        }

    } catch (err) {
        console.error("❌ API Error:", err.message);
        if (err.response) console.error(err.response.data);
    }
}

run();
