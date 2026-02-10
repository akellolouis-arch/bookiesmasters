
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

const checkSize = async () => {
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

        console.log("Fetching documents to check sizes...");
        // Fetch raw documents without projection to see true size
        const fixtures = await Fixture.find(matchFilter).lean();

        console.log(`Found ${fixtures.length} documents.`);

        let maxSizeBytes = 0;
        let largestId = null;

        fixtures.forEach(doc => {
            const size = JSON.stringify(doc).length; // Approx size
            if (size > maxSizeBytes) {
                maxSizeBytes = size;
                largestId = doc.fixtureId;
            }
            if (size > 500 * 1024) { // Warn if > 500KB
                console.warn(`⚠️ Large Document: ${doc.fixtureId} is ${(size / 1024).toFixed(2)} KB`);
            }
        });

        console.log(`🏆 Largest Document: ${largestId} is ${(maxSizeBytes / 1024).toFixed(2)} KB`);
        console.log(`📦 Total Size: ${(fixtures.reduce((acc, doc) => acc + JSON.stringify(doc).length, 0) / 1024 / 1024).toFixed(2)} MB`);


    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

checkSize();
