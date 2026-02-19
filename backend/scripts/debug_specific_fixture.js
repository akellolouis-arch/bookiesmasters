
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

        // 1. Get Details
        const res = await axios.get(`${BASE_URL}/fixtures`, {
            params: { id: id },
            headers: { "x-apisports-key": API_KEY }
        });

        const data = res.data.response[0];
        if (!data) {
            console.log("No data found.");
            return;
        }

        console.log(`Fixture: ${data.fixture.id}`);
        console.log(`Date (UTC): ${data.fixture.date}`);
        console.log(`Status: ${data.fixture.status.short} (${data.fixture.status.elapsed}')`);
        console.log(`Score: ${JSON.stringify(data.score)}`);

        // 2. Check "Coverage" if possible (sometimes useful)

        // 3. Simulate what our Poller does
        const now = new Date();
        const todayString = now.toISOString().split('T')[0];
        console.log(`\nServer Time (UTC): ${now.toISOString()}`);
        console.log(`Poller is querying date: ${todayString}`);

        if (data.fixture.date.startsWith(todayString)) {
            console.log(`✅ MATCH IS within today's query range.`);
        } else {
            console.log(`❌ MATCH IS OUTSIDE today's query range! It belongs to ${data.fixture.date.split('T')[0]}`);
        }

    } catch (err) {
        console.error(err.message);
    }
}

checkFixture(1515241);
