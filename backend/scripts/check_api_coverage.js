import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({
  path: path.resolve(__dirname, "../../.env.local"),
  override: true,
});

const API_KEY = process.env.API_KEY;

const api = axios.create({
    baseURL: "https://v3.football.api-sports.io",
    headers: {
        "x-apisports-key": API_KEY
    }
});

async function checkCoverage(country) {
    try {
        const res = await api.get("/leagues", { params: { country } });
        const leagues = res.data.response || [];
        console.log(`\n--- ${country.toUpperCase()} (${leagues.length} leagues found in API) ---`);
        
        for (const l of leagues) {
            const currentSeason = Array.isArray(l.seasons) ? l.seasons.find(s => s.current === true) : null;
            if (!currentSeason) {
                console.log(`- ${l.league.name}: No current season found`);
                continue;
            }
            
            const hasPredictions = currentSeason.coverage?.predictions === true;
            const hasOdds = currentSeason.coverage?.odds === true;
            
            console.log(`- ${l.league.name} (${currentSeason.year}): Predictions = ${hasPredictions}, Odds = ${hasOdds}`);
        }
    } catch (err) {
        console.error(`Error fetching ${country}:`, err.message);
    }
}

async function run() {
    await checkCoverage("Kenya");
    await checkCoverage("Armenia");
    await checkCoverage("Singapore");
}

run();
