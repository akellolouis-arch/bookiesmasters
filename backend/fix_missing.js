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
    
    const datesToFix = ['2026-07-21', '2026-07-22', '2026-07-23'];
    
    for (const d of datesToFix) {
        console.log(`Processing ${d}...`);
        // 1. Unset just in case
        const startOfDayKenya = new Date(`${d}T00:00:00+03:00`);
        const endOfDayKenya = new Date(`${d}T23:59:59.999+03:00`);
        await Fixture.updateMany(
            { 'fixture.fixture.date': { $gte: startOfDayKenya.toISOString(), $lte: endOfDayKenya.toISOString() } },
            { $unset: { predictionTip: 1 } }
        );
        
        // 2. Calculate
        await getPredictedFixturesGroupedByLeague(d);
        console.log(`Done with ${d}`);
        
        // Wait a bit to prevent DB overload
        await new Promise(res => setTimeout(res, 2000));
    }
    
    console.log("✅ Finished fixing missing dates");
    process.exit(0);
}

run();
