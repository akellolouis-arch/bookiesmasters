import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const API_KEY = process.env.API_KEY;
const api = axios.create({
    baseURL: "https://v3.football.api-sports.io",
    headers: { "x-apisports-key": API_KEY }
});

async function run() {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const ymd = tomorrow.toISOString().split("T")[0];

        console.log(`Fetching fixtures for ${ymd}...`);
        const res = await api.get("/fixtures", { params: { date: ymd } });
        const fixtures = res.data.response || [];

        let found = false;
        fixtures.forEach(f => {
            if (f.league.name.includes("World Cup") || f.league.name.includes("Qualification")) {
                console.log(`[Fixture ${f.fixture.id}] ${f.teams.home.name} vs ${f.teams.away.name}`);
                console.log(`  League: ${f.league.name} (ID: ${f.league.id}), Season: ${f.league.season}`);
                found = true;
            }
        });

        if (!found) {
            console.log("No World Cup or Qualification matches found in API for tomorrow.");
        }
    } catch (e) {
        console.error(e.message);
    }
}
run();
