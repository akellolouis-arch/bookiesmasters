import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getPredictedFixturesGroupedByLeague } from './services/fixtureCardService.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const start = Date.now();
    const result = await getPredictedFixturesGroupedByLeague("2026-06-14");
    console.log(`Leagues returned for 2026-06-14: ${result.length}`);
    let matches = 0;
    result.forEach(l => matches += l.matches.length);
    console.log(`Total predicted matches returned: ${matches}`);
    console.log(`Time taken: ${Date.now() - start}ms`);
    mongoose.connection.close();
}

run();
