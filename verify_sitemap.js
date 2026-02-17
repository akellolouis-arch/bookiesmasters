import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Fixture from './backend/models/Fixture.js';

dotenv.config({ path: '.env.local' });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ MONGO_URI missing in .env.local");
    process.exit(1);
}

async function verifySitemapLogic() {
    try {
        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected.");

        const future = new Date();
        future.setDate(future.getDate() + 3); // next 3 days
        const past = new Date();
        past.setHours(past.getHours() - 24); // Keep recent results for 24h

        console.log(`🔎 Querying fixtures between ${past.toISOString()} and ${future.toISOString()}...`);

        const fixtures = await Fixture.find({
            "fixture.date": { $gte: past.toISOString(), $lte: future.toISOString() }
        })
            .select("fixtureId fixture.date")
            .limit(10)
            .lean();

        console.log(`✅ Found ${fixtures.length} fixtures in date range.`);

        if (fixtures.length > 0) {
            console.log("📝 Sample URLs that would be generated:");
            fixtures.forEach(f => {
                const date = new Date(f.fixture.date).toLocaleDateString();
                console.log(`   - https://bookiesmasters.com/prediction/${f.fixtureId} (${date})`);
            });
        } else {
            console.warn("⚠️ No fixtures found. Sitemap 'matches' section will be empty.");
        }

    } catch (error) {
        console.error("❌ Verification Failed:", error);
    } finally {
        await mongoose.disconnect();
    }
}

verifySitemapLogic();
