
import mongoose from 'mongoose';
import Fixture from './backend/models/Fixture.js';
import fs from 'fs';

function loadEnv() {
    try {
        const envPath = 'C:\\Users\\Administrator\\projects\\bookiesmasters\\.env.local';
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8');
            envConfig.split('\n').forEach(line => {
                const parts = line.split('=');
                if (parts.length >= 2) {
                    process.env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
                }
            });
        }
    } catch (e) { console.error(e); }
}
loadEnv();

async function run() {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        console.log("Connecting...");
        // Set short buffering timeout
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log("Connected.");

        const count = await Fixture.countDocuments();
        console.log(`Total Fixtures: ${count}`);

        const withInjuries = await Fixture.countDocuments({ "injuries.0": { $exists: true } });
        console.log(`Fixtures with Injuries: ${withInjuries}`);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
