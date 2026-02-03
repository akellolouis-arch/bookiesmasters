
console.log("Script starting...");
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Fixture from './models/Fixture.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in .env');
    process.exit(1);
}

const debugFixture = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Search for the fixture
        const homeName = "Blackburn";
        const awayName = "Sheffield Wednesday";

        console.log(`🔎 Searching for fixture: ${homeName} vs ${awayName}`);

        const fixtures = await Fixture.find({
            "fixture.teams.home.name": { $regex: homeName, $options: 'i' },
            "fixture.teams.away.name": { $regex: awayName, $options: 'i' }
        }).sort({ "fixture.fixture.date": -1 }).limit(5).lean();

        if (fixtures.length === 0) {
            console.log("❌ No fixtures found matching these teams.");
        } else {
            console.log(`✅ Found ${fixtures.length} fixtures.`);
            fixtures.forEach(f => {
                console.log("---------------------------------------------------");
                console.log(`ID: ${f.fixtureId}`);
                console.log(`Date: ${f.fixture.fixture.date}`);
                console.log(`Status (Fixture):`, f.fixture.fixture.status);
                // Accessing livescore safely
                if (f.livescore) {
                    console.log(`Status (LiveScore):`, f.livescore.status);
                    console.log(`Score (LiveScore):`, f.livescore.score);
                    console.log(`Goals (LiveScore):`, f.livescore.goals);
                } else {
                    console.log("No 'livescore' field present.");
                }

                console.log(`Score (Fixture):`, f.fixture.score);
                console.log(`Goals (Fixture):`, f.fixture.goals);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

debugFixture();
