import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Fixture from './models/Fixture.js';
import { generateCustomBinaryPrediction } from './helpers/dbPredictionEngine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local'), override: true });

async function testOldLogic() {
    try {
        const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const futureFixtures = await Fixture.find({
            "fixture.fixture.date": { $gte: new Date().toISOString() },
            "fixture.league.name": { $not: /friendlies/i }
        }).sort({ "fixture.fixture.date": 1 }).limit(10);

        for (const doc of futureFixtures) {
            const fixDate = doc.fixture.fixture.date;
            const homeId = doc.fixture.teams.home.id;
            const awayId = doc.fixture.teams.away.id;

            const homeMatches = await Fixture.find({
                $or: [ { "fixture.teams.home.id": homeId }, { "fixture.teams.away.id": homeId } ],
                "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] },
                "fixture.fixture.date": { $lt: fixDate }
            }).sort({ "fixture.fixture.date": -1 }).limit(10).lean();

            const awayMatches = await Fixture.find({
                $or: [ { "fixture.teams.home.id": awayId }, { "fixture.teams.away.id": awayId } ],
                "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] },
                "fixture.fixture.date": { $lt: fixDate }
            }).sort({ "fixture.fixture.date": -1 }).limit(10).lean();

            const prediction = generateCustomBinaryPrediction(homeMatches, awayMatches);
            console.log(`[TESTING] ${doc.fixture.teams.home.name} vs ${doc.fixture.teams.away.name} -> Prediction: ${prediction}`);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

testOldLogic();
