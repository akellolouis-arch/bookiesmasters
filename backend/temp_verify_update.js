import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Fixture from './models/Fixture.js';
import { getPredictedFixturesGroupedByLeague, clearPredictionCache } from './services/fixtureCardService.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    
    clearPredictionCache();
    console.log("Running getPredictedFixturesGroupedByLeague for Aug 12...");
    
    // We will monkey patch Fixture.updateOne to see what it's being called with
    const originalUpdateOne = Fixture.updateOne.bind(Fixture);
    let updateCount = 0;
    
    Fixture.updateOne = function(filter, update, options) {
        updateCount++;
        if (updateCount <= 5) {
            console.log("updateOne called with:", filter, update);
        }
        return originalUpdateOne(filter, update, options);
    };

    const result = await getPredictedFixturesGroupedByLeague("2026-08-12");
    
    let count = 0;
    for (const group of result) {
        count += group.matches.length;
    }
    console.log(`Returned ${count} matches for Aug 12`);
    console.log(`updateOne was called ${updateCount} times.`);
    
    mongoose.connection.close();
}

run();
