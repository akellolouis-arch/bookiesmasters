import mongoose from "mongoose";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Fixture from "./models/Fixture.js";
import { getMongoClientOptions } from "./mongoConnectOptions.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "./.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const API_KEY = process.env.FOOTBALL_API_KEY || process.env.API_KEY || process.env.RAPIDAPI_KEY || process.env.X_APISPORTS_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

async function run() {
    await mongoose.connect(process.env.MONGO_URI, getMongoClientOptions());
    
    const ids = [1516069, 1516070, 1516071, 1516072, 1516067, 1516065, 1516066, 1516068];
    const res = await axios.get(`${BASE_URL}/fixtures`, {
        params: { ids: ids.join("-") },
        headers: { "x-apisports-key": API_KEY }
    });

    const rows = res.data.response || [];
    for (const match of rows) {
        console.log({
            id: match.fixture.id,
            apiDate: match.fixture.date,
            status: match.fixture.status.short
        });
        // Sync API date to DB
        await Fixture.updateOne(
            { fixtureId: match.fixture.id },
            { $set: { "fixture.fixture.date": match.fixture.date } }
        );
    }

    process.exit(0);
}

run();
