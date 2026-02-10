
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Define schema inline to avoid import issues if file doesn't exist
const VipFixtureSchema = new mongoose.Schema({ fixtureId: Number });
const VipFixture = mongoose.models.VipFixture || mongoose.model("VipFixture", VipFixtureSchema);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in .env');
    process.exit(1);
}

const checkIndexes = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        try {
            // Access collection directly to avoid Schema matching issues
            const indexes = await mongoose.connection.db.collection('vipfixtures').indexes();
            console.log("---------------------------------------------------");
            console.log("📊 Existing Indexes on 'vipfixtures' collection:");
            console.log(JSON.stringify(indexes, null, 2));
            console.log("---------------------------------------------------");
        } catch (e) {
            console.log("❌ Could not find vipfixtures collection or get indexes: " + e.message);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

checkIndexes();
