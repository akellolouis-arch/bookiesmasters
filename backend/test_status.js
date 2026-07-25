import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Fixture from "./models/Fixture.js";
import { getMongoClientOptions } from "./mongoConnectOptions.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.local"), override: true });

async function run() {
    await mongoose.connect(process.env.MONGO_URI, getMongoClientOptions());
    
    for (let d of ['2026-07-20', '2026-07-21', '2026-07-22']) {
        const startOfDayKenya = new Date(d + 'T00:00:00+03:00');
        const endOfDayKenya = new Date(d + 'T23:59:59.999+03:00');
        const docs = await Fixture.find({ 'fixture.fixture.date': { $gte: startOfDayKenya.toISOString(), $lte: endOfDayKenya.toISOString() } });
        const statuses = {};
        docs.forEach(f => {
            const s = f.fixture?.fixture?.status?.short;
            statuses[s] = (statuses[s] || 0) + 1;
        });
        console.log('Statuses for', d, statuses);
    }
    process.exit(0);
}

run();
