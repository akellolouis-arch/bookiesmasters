import { pollLiveScores } from './services/liveScoreService.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to Mongo. Running pollLiveScores()...");
    await pollLiveScores();
    console.log("Done.");
    process.exit(0);
}

run().catch(console.error);
