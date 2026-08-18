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

        const oneMatch = await Fixture.findOne({
            "fixture.fixture.date": {
                $gte: startOfDay.toISOString(),
                $lte: endOfDay.toISOString()
            },
            predictionTip: { $exists: true }
        });
        
        console.log(`Any match with predictionTip on Aug 15:`, oneMatch ? oneMatch.predictionTip : "None found");
        
        const count = await Fixture.countDocuments({
            "fixture.fixture.date": {
                $gte: startOfDay.toISOString(),
                $lte: endOfDay.toISOString()
            },
            predictionTip: { $exists: true }
        });
        
        console.log(`Total matches with predictionTip on Aug 15:`, count);
        
    } catch (err) {
        console.error(err);
    }
    mongoose.connection.close();
}
run();
