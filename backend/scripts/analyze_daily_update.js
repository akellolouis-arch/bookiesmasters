import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load Mongoose Models
import Fixture from "../models/Fixture.js";
import SystemConfig from "../models/SystemConfig.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") }); // Or .env

async function analyze() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // 1. Get Last Run Time
        const lastRunConfig = await SystemConfig.findOne({ key: "lastDailyUpdate" });

        let lastRunTime;
        if (lastRunConfig && lastRunConfig.value) {
            lastRunTime = new Date(lastRunConfig.value);
            console.log(`⏰ Last Daily Update Recorded: ${lastRunTime.toLocaleString()}`);
        } else {
            console.log("❓ No 'lastDailyUpdate' record found. Guessing based on recent activity...");
            // Fallback: Find most recent updated fixture
            const latestFixture = await Fixture.findOne().sort({ updatedAt: -1 });
            if (latestFixture) {
                lastRunTime = latestFixture.updatedAt;
                console.log(`   (Inferred from last update: ${lastRunTime.toLocaleString()})`);
            } else {
                console.log("❌ No fixtures in DB.");
                process.exit(0);
            }
        }

        // 2. Define Time Window (Last Run - 1 hour to Last Run + 1 hour)
        // Or just "updatedAt > Last Run - 20 mins" if the process takes time
        const startTime = new Date(lastRunTime.getTime() - 20 * 60 * 1000);
        const endTime = new Date(lastRunTime.getTime() + 20 * 60 * 1000);

        console.log(`🔎 Analyzing fixtures updated between ${startTime.toLocaleTimeString()} and ${endTime.toLocaleTimeString()}...`);

        const fixtures = await Fixture.find({
            updatedAt: { $gte: startTime, $lte: endTime }
        }).lean();

        console.log(`📊 Found ${fixtures.length} fixtures updated in this window.`);

        if (fixtures.length === 0) {
            console.log("   (Maybe the update didn't run recently? Check your server logs/time)");
            process.exit(0);
        }

        // 3. Count API Calls
        // Base: 1 call to get list of fixtures (actually 1 call per day per league, but usually ~8 calls total)
        // Per Fixture:
        // +1 for Prediction (if prediction data exists)
        // +1 for Odds (if odds data exists)
        // +1 for Injuries (if injuries data exists)

        let predictionCount = 0;
        let oddsCount = 0;
        let injuriesCount = 0;

        fixtures.forEach(f => {
            if (f.prediction) predictionCount++;
            if (f.odds && f.odds.length > 0) oddsCount++;
            if (f.injuries && f.injuries.length > 0) injuriesCount++;
        });

        const totalPerFixtureCalls = predictionCount + oddsCount + injuriesCount;
        // Approximation for "List" calls (1 call per day for 8 days = 8 calls)
        const totalCalls = totalPerFixtureCalls + 8;

        console.log("\n--- 📉 API USAGE BREAKDOWN (ESTIMATED FROM DB) ---");
        console.log(`Fixture List Fetches: ~8 calls (1 per day for 8 days)`);
        console.log(`Prediction Fetches:   ${predictionCount}`);
        console.log(`Odds Fetches:         ${oddsCount}`);
        console.log(`Injuries Fetches:     ${injuriesCount}`);
        console.log("-------------------------------------------------");
        console.log(`TOTAL REQUESTS:       ~${totalCalls}`);
        console.log("-------------------------------------------------");

        if (totalCalls > 1000) {
            console.log("\n⚠️ HIGH USAGE DETECTED!");
            console.log("   This confirms that we are fetching deep data for too many fixtures.");
        } else {
            console.log("\n✅ USAGE LOOKS OPTIMIZED/LOW.");
        }

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

analyze();
