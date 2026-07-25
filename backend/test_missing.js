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
    
    const docs = await Fixture.find({
        'fixture.fixture.date': {
          $gte: '2026-07-22T00:00:00+03:00',
          $lte: '2026-07-22T23:59:59.999+03:00'
        },
        predictionTip: { $exists: false }
    });
    
    docs.forEach(f => {
        console.log(f.fixture?.league?.name, f.fixture?.fixture?.status?.short);
    });
    process.exit(0);
}

run();
