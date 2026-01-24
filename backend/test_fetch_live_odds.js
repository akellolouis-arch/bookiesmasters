import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

async function testFetchLiveOdds() {
    try {
        console.log(`📡 Fetching Live Odds from ${BASE_URL}/odds/live...`);
        console.log(`   (Key: ${API_KEY ? "Present" : "MISSING"})`);

        const response = await axios.get(`${BASE_URL}/odds/live`, {
            params: { bookmaker: 11 }, // 1xBet
            headers: { "x-apisports-key": API_KEY }
        });

        const allLiveOdds = response.data.response || [];

        console.log(`✅ Response Status: ${response.status}`);
        console.log(`✅ Items returned: ${allLiveOdds.length}`);

        if (allLiveOdds.length > 0) {
            console.log("SAMPLE ITEM:", JSON.stringify(allLiveOdds[0], null, 2));
        } else {
            console.log("⚠ No live odds returned for Bookmaker 11.");

            // Try without bookmaker filter just to see if ANY live odds exist
            console.log("\n📡 Retrying without bookmaker filter...");
            const res2 = await axios.get(`${BASE_URL}/odds/live`, {
                headers: { "x-apisports-key": API_KEY }
            });
            console.log(`✅ Generic Fetch Items: ${res2.data.response?.length}`);
            if (res2.data.response?.length > 0) {
                console.log("SAMPLE ITEM (Generic):", JSON.stringify(res2.data.response[0], null, 2));
            }
        }

    } catch (err) {
        console.error("❌ API Error:", err.response?.data || err.message);
    }
}

testFetchLiveOdds();
