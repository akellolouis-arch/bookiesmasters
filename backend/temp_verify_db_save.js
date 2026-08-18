import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getPredictedFixturesGroupedByLeague, clearPredictionCache } from './services/fixtureCardService.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Check what happens when we run getPredictedFixturesGroupedByLeague
    clearPredictionCache();
    console.log("Running getPredictedFixturesGroupedByLeague for Aug 12...");
    const result = await getPredictedFixturesGroupedByLeague("2026-08-12");
    
    let count = 0;
    for (const group of result) {
        count += group.matches.length;
    }
    console.log(`Returned ${count} matches for Aug 12`);
    
    // Now verify the DB
    const Fixture = mongoose.model('Fixture');
    const aug12 = await Fixture.find({ 
        'fixture.fixture.date': { $gte: '2026-08-12T00:00:00+03:00', $lte: '2026-08-12T23:59:59+03:00' },
        predictionTip: { $exists: true, $ne: 'NONE' }
    });
    
    console.log(`DB has ${aug12.length} tips for Aug 12`);
    
    if (aug12.length > 0) {
        console.log(`First tip in DB: ${aug12[0].fixtureId} - ${aug12[0].predictionTip}`);
    }

    mongoose.connection.close();
}

run();
