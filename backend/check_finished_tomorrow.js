import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Fixture from "./models/Fixture.js";
import { getMongoClientOptions } from "./mongoConnectOptions.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function run() {
    await mongoose.connect(process.env.MONGO_URI, getMongoClientOptions());
    
    const date = '2026-07-25';
    const startOfDayKenya = new Date(`${date}T00:00:00+03:00`);
    const endOfDayKenya = new Date(`${date}T23:59:59.999+03:00`);
    
    const finishedTom = await Fixture.find({
        'fixture.fixture.date': {
          $gte: startOfDayKenya.toISOString(),
          $lte: endOfDayKenya.toISOString()
        },
        'fixture.fixture.status.short': { $in: ['FT', 'AET', 'PEN'] }
    });
    
    console.log(`Found ${finishedTom.length} finished fixtures on date ${date}`);
    finishedTom.forEach(f => {
        console.log({
            id: f.fixtureId,
            teams: `${f.fixture?.teams?.home?.name} vs ${f.fixture?.teams?.away?.name}`,
            date: f.fixture?.fixture?.date,
            status: f.fixture?.fixture?.status?.short
        });
    });
    
    process.exit(0);
}

run();
