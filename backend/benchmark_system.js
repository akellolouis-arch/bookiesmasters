
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getFixturesGroupedByLeague } from './services/fixtureCardService.js';
import { getFixtureById } from './services/fixtureService.js';

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

        // 1. Benchmark Home Page (All Fixtures)
        console.log("---------------------------------------------------");
        console.log(`🔥 Benchmarking Home Page (Grouped Fixtures) for ${date}...`);
        console.time("HomePage_Duration");
        const grouped = await getFixturesGroupedByLeague(date);
        console.timeEnd("HomePage_Duration");
        console.log(`📊 Leagues Returned: ${grouped.length}`);

        const jsonSize = JSON.stringify(grouped).length;
        console.log(`📦 Payload Size: ${(jsonSize / 1024 / 1024).toFixed(2)} MB`);

        // 2. Benchmark Details Page (Single Fixture)
        // Find a fixture ID from the grouped result to test
        let fixtureId = 1386773; // Default to Blackburn if not found
        if (grouped.length > 0 && grouped[0].matches.length > 0) {
            fixtureId = grouped[0].matches[0].fixtureId;
        }

        console.log("---------------------------------------------------");
        console.log(`🔥 Benchmarking Details Page (ID: ${fixtureId})...`);
        console.time("DetailsPage_Duration");
        const details = await getFixtureById(fixtureId);
        console.timeEnd("DetailsPage_Duration");

        if (details) {
            console.log(`✅ Fetched details for: ${details.homeTeam.name} vs ${details.awayTeam.name}`);
        } else {
            console.log("❌ Failed to fetch details (null returned)");
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

runBenchmark();
