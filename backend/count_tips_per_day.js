import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Fixture from './models/Fixture.js';

dotenv.config();

async function countTips() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const dates = [];
        const now = new Date();
        for (let i = -7; i <= 2; i++) {
            const d = new Date(now);
            d.setDate(d.getDate() + i);
            dates.push(d.toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" }));
        }

        console.log("Prediction tips count per day:");
        for (const date of dates) {
            const startOfDay = new Date(`${date}T00:00:00+03:00`);
            const endOfDay = new Date(`${date}T23:59:59.999+03:00`);

            const allFixtures = await Fixture.countDocuments({
                "fixture.fixture.date": {
                    $gte: startOfDay.toISOString(),
                    $lte: endOfDay.toISOString()
                }
            });

            const predictedFixtures = await Fixture.countDocuments({
                "fixture.fixture.date": {
                    $gte: startOfDay.toISOString(),
                    $lte: endOfDay.toISOString()
                },
                predictionTip: { $exists: true, $ne: "NONE" }
            });

            console.log(`- ${date}: ${predictedFixtures} tips (out of ${allFixtures} fixtures)`);
        }

        mongoose.connection.close();
    } catch (e) {
        console.error(e);
        mongoose.connection.close();
    }
}

countTips();
