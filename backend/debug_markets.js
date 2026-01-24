import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

async function listMarkets() {
    const fixtureId = 1469637;
    const response = await axios.get(`${BASE_URL}/odds/live`, {
        params: { fixture: fixtureId },
        headers: { "x-apisports-key": API_KEY }
    });

    const data = response.data.response;
    if (data.length > 0) {
        const markets = data[0].odds;
        console.log(`Found ${markets.length} markets:`);
        markets.forEach(m => {
            console.log(`ID: ${m.id}, Name: "${m.name}"`);
        });
    } else {
        console.log("No odds found.");
    }
}
listMarkets();
