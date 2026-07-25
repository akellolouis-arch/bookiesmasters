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
    console.log("🔌 Connected to DB.");
    
    const date = '2026-07-25';
    const startOfDayKenya = new Date(`${date}T00:00:00+03:00`);
    const endOfDayKenya = new Date(`${date}T23:59:59.999+03:00`);
    const matchFilter = {
        'fixture.fixture.date': {
          $gte: startOfDayKenya.toISOString(),
          $lte: endOfDayKenya.toISOString()
        }
    };
    
    console.log("matchFilter", matchFilter);
    const fixtures = await Fixture.aggregate([{ $match: matchFilter }]);
    console.log('Aggregate length:', fixtures.length);
    
    process.exit(0);
}

run();
