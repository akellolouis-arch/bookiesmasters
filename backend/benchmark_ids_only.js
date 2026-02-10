
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

const runBenchmark = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const date = new Date().toISOString().split('T')[0];
        const startOfDayKenya = new Date(`${date}T00:00:00+03:00`);
        const endOfDayKenya = new Date(`${date}T23:59:59.999+03:00`);

        const matchFilter = {
            "fixture.fixture.date": {
                $gte: startOfDayKenya.toISOString(),
                $lte: endOfDayKenya.toISOString()
            }
        };

        console.log("---------------------------------------------------");
        console.log(`🔥 Benchmarking ID ONLY for ${date}...`);

        console.time("ID_Only_Fetch");
        const fixtures = await Fixture.aggregate([
            { $match: matchFilter },
            { $project: { fixtureId: 1 } } // ONLY ID
        ]);
        console.timeEnd("ID_Only_Fetch");
        console.log(`📊 Docs Returned: ${fixtures.length}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

runBenchmark();
