import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getPredictedFixturesGroupedByLeague } from './services/fixtureCardService.js';
import Fixture from './models/Fixture.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Clear predictionTipCache by clearing DB for this day
    const startOfDayKenya = new Date(`2026-06-13T00:00:00+03:00`);
    const endOfDayKenya = new Date(`2026-06-13T23:59:59.999+03:00`);
    
    await Fixture.updateMany(
        { "fixture.fixture.date": { $gte: startOfDayKenya.toISOString(), $lte: endOfDayKenya.toISOString() } },
        { $unset: { predictionTip: 1 } }
    );
    
    const start = Date.now();
    const result = await getPredictedFixturesGroupedByLeague("2026-06-13");
    console.log(`Leagues returned for 2026-06-13: ${result.length}`);
    let matches = 0;
    result.forEach(l => matches += l.matches.length);
    console.log(`Total predicted matches returned: ${matches}`);
    console.log(`Time taken: ${Date.now() - start}ms`);
    mongoose.connection.close();
}

run();
