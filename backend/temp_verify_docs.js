import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Fixture from './models/Fixture.js';
import { getPredictedFixturesGroupedByLeague, clearPredictionCache } from './services/fixtureCardService.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const startOfDay = new Date(`2026-08-12T00:00:00+03:00`);
    const endOfDay = new Date(`2026-08-12T23:59:59.999+03:00`);
    
    // First let's check exactly how many fixtures exist in DB for this date
    const count = await Fixture.countDocuments({
        "fixture.fixture.date": {
            $gte: startOfDay.toISOString(),
            $lte: endOfDay.toISOString()
        }
    });
    console.log(`Total fixtures in DB for Aug 12: ${count}`);
    
    // Unset tip to be sure
    await Fixture.updateMany({
        "fixture.fixture.date": {
            $gte: startOfDay.toISOString(),
            $lte: endOfDay.toISOString()
        }
    }, { $unset: { predictionTip: 1 } });
    console.log(`Unset predictionTip for Aug 12`);
    
    clearPredictionCache();
    console.log("Running getPredictedFixturesGroupedByLeague for Aug 12...");
    
    const originalUpdateOne = Fixture.updateOne.bind(Fixture);
    let updateCount = 0;
    
    Fixture.updateOne = function(filter, update, options) {
        updateCount++;
        return originalUpdateOne(filter, update, options);
    };

    const result = await getPredictedFixturesGroupedByLeague("2026-08-12");
    
    let tipCount = 0;
    for (const group of result) {
        tipCount += group.matches.length;
    }
    console.log(`Returned ${tipCount} matches with tips for Aug 12`);
    console.log(`updateOne was called ${updateCount} times.`);
    
    mongoose.connection.close();
}

run();
