import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getPredictedFixturesGroupedByLeague } from './services/fixtureCardService.js';

dotenv.config();

async function precalculate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB. Pre-calculating tips to avoid frontend timeouts...");

        const dates = [];
        const now = new Date();
        for (let i = -1; i <= 2; i++) {
            const d = new Date(now);
            d.setDate(d.getDate() + i);
            dates.push(d.toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" }));
        }

        for (const date of dates) {
            console.log(`\nCalculating for ${date}...`);
            try {
                const start = Date.now();
                // This calls applyPredictionFilter, which saves to DB
                await getPredictedFixturesGroupedByLeague(date);
                console.log(`Done for ${date} in ${Date.now() - start}ms`);
            } catch (err) {
                console.error(`Error for ${date}:`, err);
            }
        }

        console.log("\nFinished pre-calculating! Frontend should now load instantly.");
        mongoose.connection.close();
    } catch (e) {
        console.error(e);
        mongoose.connection.close();
    }
}

precalculate();
