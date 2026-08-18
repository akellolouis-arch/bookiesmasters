import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Fixture from './models/Fixture.js';
import { getPredictedFixturesGroupedByLeague, clearPredictionCache } from './services/fixtureCardService.js';

dotenv.config();

async function test() {
    await mongoose.connect(process.env.MONGO_URI);
    clearPredictionCache();
    
    // Pick a few fixtures from yesterday and see their predictions
    console.log("Checking 2026-08-13");
    await Fixture.updateMany(
      { "fixture.fixture.date": { $gte: "2026-08-13T00:00:00+03:00", $lte: "2026-08-13T23:59:59+03:00" } },
      { $unset: { predictionTip: 1 } }
    );

    const result = await getPredictedFixturesGroupedByLeague("2026-08-13");
    console.log("Result for 2026-08-13:", JSON.stringify(result, null, 2).slice(0, 500));
    
    // Check if it's returning anything
    let count = 0;
    for (const group of result) {
        count += group.matches.length;
    }
    console.log("Total predictions for 2026-08-13:", count);

    mongoose.connection.close();
}

test();
