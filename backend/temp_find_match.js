import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Fixture from './models/Fixture.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    try {
        const matches = await Fixture.find({
            "fixture.fixture.date": { $gte: "2026-08-10T00:00:00+03:00", $lte: "2026-08-20T23:59:59+03:00" },
            $or: [
                { "fixture.teams.home.name": { $regex: /vasco|olimpia/i } },
                { "fixture.teams.away.name": { $regex: /vasco|olimpia/i } }
            ]
        }).sort({ "fixture.fixture.date": 1 });
        
        matches.forEach(m => {
            console.log(`${m.fixture.fixture.date}: ${m.fixture.teams.home.name} vs ${m.fixture.teams.away.name} (Tip: ${m.predictionTip})`);
        });
    } catch (err) {
        console.error(err);
    }
    mongoose.connection.close();
}
run();
