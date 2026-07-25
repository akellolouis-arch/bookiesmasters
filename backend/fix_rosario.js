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
    console.log("🔌 Connected to DB.");
    
    // Fix Argentino Rosario vs Puerto Nuevo (fixture 1500006)
    const result = await Fixture.updateOne(
        { fixtureId: 1500006 },
        { $set: { "fixture.fixture.date": "2026-07-23T18:00:00+00:00" } }
    );
    console.log("Updated fixture 1500006 date result:", result);

    process.exit(0);
}

run();
