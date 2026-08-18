import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Fixture from './models/Fixture.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    try {
        const dateStr = "2026-08-15";
        const startOfDay = new Date(`${dateStr}T00:00:00+03:00`);
        const endOfDay = new Date(`${dateStr}T23:59:59.999+03:00`);

        const orderedDocs = await Fixture.aggregate([
            {
                $match: {
                    "fixture.fixture.date": {
                        $gte: startOfDay.toISOString(),
                        $lte: endOfDay.toISOString()
                    },
                    "fixture.fixture.status.short": { $in: ["NS", "1H", "HT", "2H", "ET", "BT", "P", "LIVE", "TBD"] }
                }
            },
            {
                $project: {
                    fixtureId: 1,
                    "fixture.fixture": 1,
                    "fixture.league": 1,
                    "fixture.teams": 1,
                    predictionTip: 1
                }
            }
        ]);
        console.log(`Actual orderedDocs length: ${orderedDocs.length}`);
    } catch (err) {
        console.error(err);
    }
    mongoose.connection.close();
}
run();
