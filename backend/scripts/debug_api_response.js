
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

async function checkFixture(id) {
    try {
        console.log(`Checking API response for fixture ${id}...`);
        const res = await axios.get(`${BASE_URL}/fixtures`, {
            params: { id: id },
            headers: { "x-apisports-key": API_KEY }
        });

        const data = res.data.response[0];
        if (!data) {
            console.log("No data found.");
            return;
        }

        console.log("Status:", data.fixture.status);
        console.log("Score:", data.score);
        console.log("Date:", data.fixture.date);

    } catch (err) {
        console.error(err.message);
    }
}

// Check the one that looked stuck at 90'
checkFixture(1494509);
