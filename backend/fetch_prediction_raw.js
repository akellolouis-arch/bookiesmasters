import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://v3.football.api-sports.io";
const FIXTURE_ID = 1492126;

async function fetchPrediction() {
    try {
        console.log(`Fetching prediction for fixture ${FIXTURE_ID}...`);

        const response = await axios.get(`${BASE_URL}/predictions`, {
            params: { fixture: FIXTURE_ID },
            headers: { "x-apisports-key": API_KEY }
        });

        const data = response.data.response;
        if (data.length > 0) {
            const pred = data[0].predictions;
            console.log("Win or Draw:", pred.win_or_draw);
            console.log("Under Over:", pred.under_over);
            console.log("Goals Home:", pred.goals.home);
            console.log("Goals Away:", pred.goals.away);
            console.log("Advice:", pred.advice);
            console.log("Percent Home:", pred.percent.home);
            console.log("Percent Draw:", pred.percent.draw);
            console.log("Percent Away:", pred.percent.away);
            console.log("Winner:", pred.winner);
        } else {
            console.log("No prediction found for this fixture.");
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
}

fetchPrediction();
