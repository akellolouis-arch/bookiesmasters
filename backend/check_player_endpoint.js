import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

const api = axios.create({
    baseURL: "https://v3.football.api-sports.io",
    headers: {
        "x-apisports-key": process.env.API_KEY
    }
});

async function checkPlayerEndpoint() {
    try {
        console.log("Fetching Antoine Semenyo (ID: 19281) from /players endpoint...");
        // Fetch specific player for the current season
        const res = await api.get("/players", {
            params: { id: 19281, season: 2024 }
        });

        const playerStats = res.data.response[0]?.statistics;

        if (playerStats) {
            console.log("Found Semenyo's detailed season stats:");
            console.log(JSON.stringify(playerStats, null, 2));
        } else {
            console.log("No detailed stats found.");
        }
    } catch (err) {
        console.error("API Error:", err.message);
    }
}

checkPlayerEndpoint();
