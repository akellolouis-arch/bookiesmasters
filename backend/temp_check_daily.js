import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    try {
        const db = mongoose.connection.db;
        const col = db.collection('systemconfigs');
        const config = await col.findOne({ key: "lastDailyUpdate" });
        console.log("lastDailyUpdate:", config);
        
        const Fixture = mongoose.model('Fixture', new mongoose.Schema({}, { strict: false }));
        const tCount = await Fixture.countDocuments({
            "fixture.fixture.date": { $gte: "2026-08-15T00:00:00+03:00", $lte: "2026-08-15T23:59:59+03:00" },
            predictionTip: { $exists: true }
        });
        const mCount = await Fixture.countDocuments({
            "fixture.fixture.date": { $gte: "2026-08-16T00:00:00+03:00", $lte: "2026-08-16T23:59:59+03:00" },
            predictionTip: { $exists: true }
        });
        console.log("Aug 15 tips count:", tCount);
        console.log("Aug 16 tips count:", mCount);
    } catch (err) {
        console.error(err);
    }
    mongoose.connection.close();
}
run();
