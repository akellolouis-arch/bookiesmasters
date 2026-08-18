import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Fixture from './models/Fixture.js';
import { getPredictedFixturesGroupedByLeague } from './services/fixtureCardService.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    try {
        console.log("Fetching DB counts directly...");
        const tCount = await Fixture.countDocuments({
            "fixture.fixture.date": { $gte: "2026-08-15T00:00:00+03:00", $lte: "2026-08-15T23:59:59+03:00" },
            predictionTip: { $ne: "NONE", $exists: true, $ne: null }
        });
        const nCount = await Fixture.countDocuments({
            "fixture.fixture.date": { $gte: "2026-08-15T00:00:00+03:00", $lte: "2026-08-15T23:59:59+03:00" },
            predictionTip: "NONE"
        });
        const mCount = await Fixture.countDocuments({
            "fixture.fixture.date": { $gte: "2026-08-15T00:00:00+03:00", $lte: "2026-08-15T23:59:59+03:00" },
            predictionTip: { $exists: false }
        });
        
        console.log(`Aug 15 -> Tips: ${tCount}, NONE: ${nCount}, Missing: ${mCount}`);
        
    } catch (err) {
        console.error(err);
    }
    mongoose.connection.close();
}
run();
