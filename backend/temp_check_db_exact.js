import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Fixture from './models/Fixture.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const startOfDay = new Date(`2026-08-12T00:00:00+03:00`);
    const endOfDay = new Date(`2026-08-12T23:59:59.999+03:00`);
    
    const matchFilter = {
        "fixture.fixture.date": {
            $gte: startOfDay.toISOString(),
            $lte: endOfDay.toISOString()
        }
    };
    
    const fixtures = await Fixture.aggregate([
        { $match: matchFilter },
        {
          $project: {
            fixtureId: 1,
            "fixture.fixture": 1,
            predictionTip: 1,
          }
        }
    ]);
    
    let noneCount = 0;
    let tipCount = 0;
    let missingCount = 0;
    
    for (const doc of fixtures) {
        if (doc.predictionTip === "NONE") noneCount++;
        else if (doc.predictionTip) tipCount++;
        else missingCount++;
    }
    
    console.log(`Fixtures: ${fixtures.length}`);
    console.log(`NONE: ${noneCount}, Tips: ${tipCount}, Missing: ${missingCount}`);
    
    mongoose.connection.close();
}

run();
