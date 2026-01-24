import mongoose from "mongoose";
import dotenv from "dotenv";
import { pollLiveOdds } from "./services/liveScoreService.js";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";

async function forceRun() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("🔌 Connected to MongoDB");

        console.log("🚀 Forcing Poll Live Odds...");
        await pollLiveOdds();

        console.log("✅ Done.");
    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

forceRun();
