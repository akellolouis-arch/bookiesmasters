import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Fixture from './models/Fixture.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local'), override: true });

async function clearCache() {
    try {
        const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear predictionTip and dbPrediction for anything from yesterday onwards to be safe
        const KENYA_TZ = "Africa/Nairobi";
        const kenyaYmdFormatter = new Intl.DateTimeFormat("en-CA", {
            timeZone: KENYA_TZ,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
        const todayYmd = kenyaYmdFormatter.format(new Date());
        const [y, m, d] = todayYmd.split("-").map(Number);
        
        // Start clearing from today
        const start = new Date(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T00:00:00+03:00`).toISOString();

        console.log(`Clearing cached predictions for matches on or after ${start}...`);

        const result = await Fixture.updateMany(
            { "fixture.fixture.date": { $gte: start } },
            { $unset: { predictionTip: "", dbPrediction: "" } }
        );

        console.log(`Successfully cleared cache for ${result.modifiedCount} matches!`);
        console.log("These matches will now be recalculated using the new ultra-strict logic on the next page load.");

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

clearCache();
