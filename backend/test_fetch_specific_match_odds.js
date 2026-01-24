import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

async function testSpecific() {
    try {
        console.log(`📡 Fetching Live Odds...`);

        // We can't filter by fixture ID in /odds/live endpoint natively?
        // Actually the docs say /odds/live takes 'fixture' param or 'league' or 'bookmaker'.
        // Let's try passing fixture ID directly.
        const fixtureId = 1469637;

        const response = await axios.get(`${BASE_URL}/odds/live`, {
            params: { fixture: fixtureId },
            headers: { "x-apisports-key": API_KEY }
        });

        const data = response.data.response;
        console.log(`✅ Returned ${data.length} items for fixture ${fixtureId}`);

        if (data.length > 0) {
            console.log(JSON.stringify(data[0], null, 2));
        } else {
            console.log("No live odds found for this fixture ID.");

            // Fallback: fetch ALL and find it manually
            console.log("Fetching ALL live odds to search manual...");
            const res2 = await axios.get(`${BASE_URL}/odds/live`, {
                headers: { "x-apisports-key": API_KEY }
            });
            const found = res2.data.response.find(x => x.fixture.id === fixtureId);
            if (found) {
                console.log("FOUND in global list:");
                console.log(JSON.stringify(found, null, 2));
            } else {
                console.log("Not found in global live odds list either.");
            }
        }

    } catch (err) {
        console.error("❌ API Error:", err.message);
    }
}

testSpecific();
