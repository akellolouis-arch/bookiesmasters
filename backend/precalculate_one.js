import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getPredictedFixturesGroupedByLeague } from './services/fixtureCardService.js';
import Fixture from './models/Fixture.js';

dotenv.config();

async function run() {
    const date = process.argv[2];
    if (!date) process.exit(1);

    await mongoose.connect(process.env.MONGO_URI);
    
    // Clear DB for this day
    const startOfDayKenya = new Date(`${date}T00:00:00+03:00`);
    const endOfDayKenya = new Date(`${date}T23:59:59.999+03:00`);
    
    await Fixture.updateMany(
        { "fixture.fixture.date": { $gte: startOfDayKenya.toISOString(), $lte: endOfDayKenya.toISOString() } },
        { $unset: { predictionTip: 1 } }
    );
    
    const start = Date.now();
    const result = await getPredictedFixturesGroupedByLeague(date);
    let matches = 0;
    result.forEach(l => matches += l.matches.length);
    console.log(`[${date}] Found ${matches} tips in ${Date.now() - start}ms`);
    
    mongoose.connection.close();
}

run();
