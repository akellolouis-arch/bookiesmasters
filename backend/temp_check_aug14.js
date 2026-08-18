import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Fixture from './models/Fixture.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    try {
        const count = await Fixture.countDocuments({
            "fixture.fixture.date": {
                $gte: "2026-08-14T00:00:00+03:00",
                $lte: "2026-08-14T23:59:59.999+03:00"
            },
            predictionTip: { $exists: true }
        });
        
        console.log(`Total matches with predictionTip on Aug 14:`, count);
    } catch (err) {
        console.error(err);
    }
    mongoose.connection.close();
}
run();
