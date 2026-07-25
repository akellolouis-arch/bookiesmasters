import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Fixture from "./models/Fixture.js";
import { getPredictedFixturesGroupedByLeague } from "./services/fixtureCardService.js";
import { getMongoClientOptions } from "./mongoConnectOptions.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.local"), override: true });

async function run() {
    await mongoose.connect(process.env.MONGO_URI, getMongoClientOptions());
    console.log("🔌 Connected to DB.");
    
    // Pick one fixture
    const startOfDay = new Date(`2026-07-24T00:00:00+03:00`);
    const endOfDay = new Date(`2026-07-24T23:59:59.999+03:00`);
    
    const docs = await Fixture.find({
        "fixture.fixture.date": {
            $gte: startOfDay.toISOString(),
            $lte: endOfDay.toISOString()
        }
    }).limit(1);
    
    console.log(`Found ${docs.length} docs`);
    if(docs.length > 0) {
        const fixtureId = docs[0].fixtureId;
        console.log(`Testing with fixtureId: ${fixtureId}`);
        // Run getPredictedFixturesGroupedByLeague
        await getPredictedFixturesGroupedByLeague("2026-07-24");
        
        const docAfter = await Fixture.findOne({ fixtureId });
        console.log(`After calculation, predictionTip is: ${docAfter.predictionTip}`);
    }
    
    process.exit(0);
}

run();
