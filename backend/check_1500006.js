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
    
    const doc = await Fixture.findOne({ fixtureId: 1500006 }).lean();
    console.log(JSON.stringify(doc, null, 2));
    process.exit(0);
}

run();
