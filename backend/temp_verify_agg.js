import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Fixture from './models/Fixture.js';
import { getPredictedFixturesGroupedByLeague, clearPredictionCache } from './services/fixtureCardService.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const startOfDay = new Date(`2026-08-12T00:00:00+03:00`);
    const endOfDay = new Date(`2026-08-12T23:59:59.999+03:00`);
    
    await Fixture.updateMany({
        "fixture.fixture.date": {
            $gte: startOfDay.toISOString(),
            $lte: endOfDay.toISOString()
        }
    }, { $unset: { predictionTip: 1 } });
    
    clearPredictionCache();
    
    const originalAggregate = Fixture.aggregate.bind(Fixture);
    Fixture.aggregate = async function(pipeline) {
        const res = await originalAggregate(pipeline);
        console.log(`Aggregate returned ${res.length} matches`);
        return res;
    };

    const originalUpdateOne = Fixture.updateOne.bind(Fixture);
    Fixture.updateOne = function(filter, update, options) {
        return originalUpdateOne(filter, update, options);
    };

    const result = await getPredictedFixturesGroupedByLeague("2026-08-12");
    
    let tipCount = 0;
    for (const group of result) {
        tipCount += group.matches.length;
    }
    console.log(`Returned ${tipCount} matches with tips for Aug 12`);
    
    mongoose.connection.close();
}

run();
