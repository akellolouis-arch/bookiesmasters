import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { pollLiveScores } from "./services/liveScoreService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB connected");
        
        await pollLiveScores();
        
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
}

run();
