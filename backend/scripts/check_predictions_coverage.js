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

async function run() {
    try {
        console.log("Fetching ALL leagues from API-Football...");
        const res = await api.get("/leagues");
        const allLeagues = res.data.response || [];
        console.log(`Found ${allLeagues.length} total leagues in the API.`);

        let hasCurrentSeason = 0;
        let hasPredictions = 0;
        let hasOdds = 0;

        for (const l of allLeagues) {
            const currentSeason = Array.isArray(l.seasons) ? l.seasons.find(s => s.current === true) : null;
            if (currentSeason) {
                hasCurrentSeason++;
                if (currentSeason.coverage?.predictions === true) {
                    hasPredictions++;
                }
                if (currentSeason.coverage?.odds === true) {
                    hasOdds++;
                }
            }
        }

        console.log(`Leagues with a CURRENT season: ${hasCurrentSeason}`);
        console.log(`Leagues with predictions coverage: ${hasPredictions}`);
        console.log(`Leagues with odds coverage: ${hasOdds}`);
        
    } catch (err) {
        console.error("Error:", err.message);
    }
}

run();
