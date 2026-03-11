import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const api = axios.create({
    baseURL: "https://v3.football.api-sports.io",
    headers: { "x-apisports-key": process.env.API_KEY }
});


export async function fetchInjuries(fixtureId) {
    try {
        console.log(`🚑 Fetching Injuries for fixture ${fixtureId}...`);
        const res = await api.get("/injuries", {
            params: { fixture: fixtureId }
        });
        return res.data.response || [];
    } catch (err) {
        console.error(`❌ Error fetching injuries for ${fixtureId}:`, err.message);
        return [];
    }
}
