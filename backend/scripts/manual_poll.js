
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { pollActiveMatchScores } from "../services/scorePollingService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function run() {
    try {
        console.log("🔌 Connecting to MongoDB...");
        console.log("URI:", process.env.MONGO_URI ? "Found" : "Missing");

        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB connected");

        console.log("🚀 Starting Manual Poll...");
        await pollActiveMatchScores();

        console.log("✅ Done.");
        process.exit(0);

    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
}

run();
