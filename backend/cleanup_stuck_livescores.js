import dotenv from "dotenv";
import mongoose from "mongoose";
import Fixture from "./models/Fixture.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

async function cleanupLivescores() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Custom Script: Connected to MongoDB");

        // Definition of LIVE statuses
        const LIVE_STATUSES = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"];

        // Find documents where:
        // 1. livescore field EXISTS
        // 2. fixture.status.short is NOT in LIVE_STATUSES (meaning it's FT, NS, PST, etc.)
        const query = {
            livescore: { $exists: true, $ne: null },
            "fixture.fixture.status.short": { $nin: LIVE_STATUSES }
        };

        const count = await Fixture.countDocuments(query);
        console.log(`🔎 Found ${count} fixtures with STUCK livescore data (Status is non-live, but livescore exists).`);

        if (count > 0) {
            const res = await Fixture.updateMany(query, {
                $unset: { livescore: 1, liveOdds: 1 }
            });
            console.log(`🧹 Cleared livescore/liveOdds for ${res.modifiedCount} fixtures.`);
        } else {
            console.log("✨ No cleanup needed.");
        }

    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await mongoose.disconnect();
        console.log("👋 Disconnected");
    }
}

cleanupLivescores();
