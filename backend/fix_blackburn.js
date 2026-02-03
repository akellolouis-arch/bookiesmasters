
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Fixture from './models/Fixture.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in .env');
    process.exit(1);
}

const fixFixture = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const fixtureId = 1386773;

        console.log(`🔧 Fixing fixture: ${fixtureId}`);

        const res = await Fixture.updateOne(
            { fixtureId: fixtureId },
            { $unset: { livescore: 1, liveOdds: 1 } }
        );

        console.log(`✅ Update Result:`, res);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

fixFixture();
