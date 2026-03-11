import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

const api = axios.create({
    baseURL: "https://v3.football.api-sports.io",
    headers: {
        "x-apisports-key": process.env.API_KEY
    }
});

async function checkSquad() {
    try {
        console.log("Checking Man City squad (Team ID: 47)...");
        const res = await api.get("/players/squads", {
            params: { team: 47 }
        });

        const squad = res.data.response[0]?.players;

        if (squad) {
            const semenyo = squad.find(p => p.name.toLowerCase().includes("semenyo"));
            if (semenyo) {
                console.log("Found Semenyo in Man City squad:");
                console.log(JSON.stringify(semenyo, null, 2));
            } else {
                console.log("Semenyo NOT FOUND in Man City Squad.");
            }
        } else {
            console.log("No squad data found.");
        }
    } catch (err) {
        console.error("API Error:", err.message);
    }
}

checkSquad();
