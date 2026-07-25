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
    
    const date = '2026-07-25';
    const startOfDayKenya = new Date(`${date}T00:00:00+03:00`);
    const endOfDayKenya = new Date(`${date}T23:59:59.999+03:00`);
    
    const fixtures = await Fixture.find({
        'fixture.fixture.date': {
          $gte: startOfDayKenya.toISOString(),
          $lte: endOfDayKenya.toISOString()
        }
    });
    
    const counts = {};
    fixtures.forEach(f => {
        const tip = f.predictionTip;
        counts[tip] = (counts[tip] || 0) + 1;
    });
    console.log(counts);
    process.exit(0);
}

run();
