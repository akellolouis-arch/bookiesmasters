import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getPredictedFixturesGroupedByLeague } from './services/fixtureCardService.js';
import Fixture from './models/Fixture.js';

dotenv.config();

async function runAllDays() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB. Wiping cache and precalculating -7 to +7 days...");

        // 1. Wipe entire cache
        const result = await Fixture.updateMany(
            { predictionTip: { $exists: true } },
            { $unset: { predictionTip: 1 } }
        );
        console.log(`Cleared predictionTip from ${result.modifiedCount} matches.`);

        // 2. Build dates array (-7 to +7)
        const dates = [];
        const now = new Date();
        for (let i = -7; i <= 7; i++) {
            const d = new Date(now);
            d.setDate(d.getDate() + i);
            dates.push(d.toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" }));
        }

        // 3. Precalculate
        for (const date of dates) {
            console.log(`\nCalculating for ${date}...`);
            try {
                const start = Date.now();
                await getPredictedFixturesGroupedByLeague(date);
                console.log(`Done for ${date} in ${Date.now() - start}ms`);
            } catch (err) {
                console.error(`Error for ${date}:`, err);
            }
        }

        console.log("\nFinished precalculating all days!");
        mongoose.connection.close();
    } catch (e) {
        console.error(e);
        mongoose.connection.close();
    }
}

runAllDays();
