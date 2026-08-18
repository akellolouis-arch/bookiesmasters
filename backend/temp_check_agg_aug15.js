import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Fixture from './models/Fixture.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    try {
        const startOfDay = new Date(`2026-08-15T00:00:00+03:00`);
        const endOfDay = new Date(`2026-08-15T23:59:59.999+03:00`);

        const orderedDocs = await Fixture.aggregate([
            {
                $match: {
                    "fixture.fixture.date": {
                        $gte: startOfDay.toISOString(),
                        $lte: endOfDay.toISOString()
                    }
                }
            }
        ]);
        console.log(`Aggregate found ${orderedDocs.length} matches for Aug 15.`);
    } catch (err) {
        console.error(err);
    }
    mongoose.connection.close();
}
run();
