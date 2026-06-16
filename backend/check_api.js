import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

async function checkApi() {
    try {
        const fixtureId = 1508056;
        console.log("Fetching fixture", fixtureId, "from API...");
        const response = await axios.get(`https://v3.football.api-sports.io/fixtures?id=${fixtureId}`, {
            headers: {
                'x-rapidapi-host': 'v3.football.api-sports.io',
                'x-rapidapi-key': process.env.API_SPORTS_KEY
            }
        });
        
        const apiData = response.data.response[0];
        if (apiData) {
            console.log(">> API Status:", apiData.fixture.status.short, "| Elapsed:", apiData.fixture.status.elapsed);
            console.log(">> API Score:", JSON.stringify(apiData.score));
        } else {
            console.log(">> No API Data returned");
        }
    } catch (err) {
        console.error("API Fetch Error:", err.message);
    }
}

checkApi();
