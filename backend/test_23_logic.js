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
    
    console.log("Running getPredictedFixturesGroupedByLeague for 2026-07-23...");
    try {
        const result = await getPredictedFixturesGroupedByLeague("2026-07-23");
        console.log(`Result length: ${result.length}`);
    } catch(e) {
        console.error("Error:", e);
    }
    
    const count = await Fixture.countDocuments({
        'fixture.fixture.date': {
          $gte: '2026-07-23T00:00:00+03:00',
          $lte: '2026-07-23T23:59:59.999+03:00'
        },
        predictionTip: { $exists: false }
    });
    
    console.log(`Missing predictionTip count: ${count}`);
    
    process.exit(0);
}

run();
