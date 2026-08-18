import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Fixture from './models/Fixture.js';
import { getPredictedFixturesGroupedByLeague } from './services/fixtureCardService.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    try {
        const result = await getPredictedFixturesGroupedByLeague("2026-08-13");
        let tipCount = 0;
        for (const group of result) {
            for (const match of group.matches) {
                if (match.prediction && match.prediction !== "NONE") {
                    tipCount++;
                }
            }
        }
        console.log(`Frontend API output for Aug 13 - Valid Predictions: ${tipCount}`);
    } catch (err) {
        console.error(err);
    }
    mongoose.connection.close();
}
run();
