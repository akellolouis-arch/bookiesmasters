import mongoose from "mongoose";
import dotenv from "dotenv";
import Fixture from "./models/Fixture.js";
import { getPredictedFixturesGroupedByLeague, clearPredictionCache } from "./services/fixtureCardService.js";

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("🔌 Connected to DB.");

        for (const dateStr of ["2026-08-15", "2026-08-16"]) {
            console.log(`\n📅 --- Processing Date: ${dateStr} ---`);
            clearPredictionCache();
            
            const startOfDay = new Date(`${dateStr}T00:00:00+03:00`);
            const endOfDay = new Date(`${dateStr}T23:59:59.999+03:00`);
            
            const clearResult = await Fixture.updateMany(
                {
                    "fixture.fixture.date": {
                        $gte: startOfDay.toISOString(),
                        $lte: endOfDay.toISOString()
                    }
                },
                { $unset: { predictionTip: 1 } }
            );
            console.log(`🧹 Cleared existing predictionTip for ${clearResult.modifiedCount} fixtures.`);
            
            console.log(`🧠 Calculating new predictions...`);
            await getPredictedFixturesGroupedByLeague(dateStr);
            console.log(`✅ Finished calculating for ${dateStr}.`);
        }
        
        console.log("\n🎉 Days recalculated successfully!");
        process.exit(0);
    } catch (e) {
        console.error("❌ Error running script:", e);
        process.exit(1);
    }
}

run();
