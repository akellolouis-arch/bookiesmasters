import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

const api = axios.create({
    baseURL: "https://v3.football.api-sports.io",
    headers: {
        "x-apisports-key": process.env.API_KEY
    }
});

async function displaySemenyoTopScorerData() {
    try {
        console.log("=================================================");
        console.log("📡 FETCHING EPL TOP SCORERS FROM API-FOOTBALL...");
        console.log("=================================================");

        const res = await api.get("/players/topscorers", {
            // League 39 = Premier League, Season = 2024
            params: { league: 39, season: 2024 }
        });

        const players = res.data.response;

        if (!players || players.length === 0) {
            console.log("No top scorers found for EPL 2024 season.");
            return;
        }

        // Find Semenyo in the array
        const semenyo = players.find(p => p.player.lastname.toLowerCase().includes("semenyo") || p.player.name.toLowerCase().includes("semenyo"));

        if (semenyo) {
            console.log("\n✅ FOUND ANTOINE SEMENYO IN TOP SCORERS LIST (Rank: " + (players.indexOf(semenyo) + 1) + ")");
            console.log("\n--- EXACT RAW JSON RESPONSE FROM API ---");
            console.log(JSON.stringify(semenyo, null, 2));
        } else {
            console.log("❌ Antoine Semenyo NOT found in the Top 20 scorers for EPL right now.");
        }
    } catch (err) {
        console.error("API Error:", err.message);
    }
}

displaySemenyoTopScorerData();
