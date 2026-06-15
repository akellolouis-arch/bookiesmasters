import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getPredictedFixturesGroupedByLeague } from './services/fixtureCardService.js';

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const result = await getPredictedFixturesGroupedByLeague("2026-06-14");
        console.log(`Leagues returned: ${result.length}`);
        let totalMatches = 0;
        result.forEach(l => {
            totalMatches += l.matches.length;
        });
        console.log(`Total predicted matches for yesterday: ${totalMatches}`);
        mongoose.connection.close();
    } catch (e) {
        console.error(e);
        mongoose.connection.close();
    }
}

run();
