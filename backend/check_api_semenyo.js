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

async function checkApiData() {
    try {
        console.log("Fetching EPL top scorers from API...");
        const res = await api.get("/players/topscorers", {
            params: { league: 39, season: 2024 }
        });

        const players = res.data.response;

        const semenyo = players.find(p => p.player.lastname.toLowerCase().includes("semenyo") || p.player.name.toLowerCase().includes("semenyo"));

        if (semenyo) {
            console.log("Found Antoine Semenyo in API response (ALL Statistics):");
            console.log(JSON.stringify(semenyo.statistics, null, 2));
        } else {
            console.log("Antoine Semenyo not found in the Top 20 scorers for EPL.");
        }
    } catch (err) {
        console.error("API Error:", err.message);
    }
}

checkApiData();
