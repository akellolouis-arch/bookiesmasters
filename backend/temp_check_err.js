import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Fixture from './models/Fixture.js';
import { getPredictedFixturesGroupedByLeague, clearPredictionCache } from './services/fixtureCardService.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // We already unset the DB.
    clearPredictionCache();
    
    // Monkey patch the sort function to intercept orderedDocs
    const fs = await import('fs');
    const serviceCode = fs.readFileSync('./services/fixtureCardService.js', 'utf-8');
    
    // I can't easily monkey patch an internal function.
    // Instead I'll just run it and see if it crashes.
    try {
        const result = await getPredictedFixturesGroupedByLeague("2026-08-12");
        let tipCount = 0;
        for (const group of result) {
            tipCount += group.matches.length;
        }
        console.log(`Returned ${tipCount} matches with tips for Aug 12`);
    } catch (err) {
        console.error("Caught error:", err);
    }
    
    mongoose.connection.close();
}

run();
