import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Fixture from './models/Fixture.js';

dotenv.config();

async function clearCache() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const result = await Fixture.updateMany(
            { predictionTip: { $exists: true } },
            { $unset: { predictionTip: 1 } }
        );

        console.log(`Cleared predictionTip from ${result.modifiedCount} matches.`);
        mongoose.connection.close();
    } catch (e) {
        console.error(e);
        mongoose.connection.close();
    }
}

clearCache();
