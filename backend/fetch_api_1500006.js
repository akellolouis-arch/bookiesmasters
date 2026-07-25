import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "./.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const API_KEY = process.env.FOOTBALL_API_KEY || process.env.API_KEY || process.env.RAPIDAPI_KEY || process.env.X_APISPORTS_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

async function run() {
    console.log("API_KEY found:", API_KEY ? `${API_KEY.slice(0, 5)}...` : "NONE");
    if (!API_KEY) process.exit(1);

    console.log("Fetching fixture 1500006 from API...");
    const res = await axios.get(`${BASE_URL}/fixtures`, {
        params: { id: 1500006 },
        headers: { "x-apisports-key": API_KEY }
    });
    console.log(JSON.stringify(res.data.response[0], null, 2));
    process.exit(0);
}

run();
