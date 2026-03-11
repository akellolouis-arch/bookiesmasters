import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

import TopScorer from "./models/TopScorer.js";

async function checkSemenyo() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Premier League ID is 39
        const eplScorers = await TopScorer.findOne({ "league.id": 39 }).lean();

        if (!eplScorers) {
            console.log("No Top Scorer document found for the Premier League.");
            return;
        }

        const semenyo = eplScorers.players.find(p => p.player.lastname.toLowerCase().includes("semenyo") || p.player.name.toLowerCase().includes("semenyo"));

        if (semenyo) {
            console.log("Found Antoine Semenyo:");
            console.log(JSON.stringify(semenyo, null, 2));
        } else {
            console.log("Antoine Semenyo not found in the Top 20 scorers for EPL.");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

checkSemenyo();
