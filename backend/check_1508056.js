import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Fixture from "./models/Fixture.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

async function checkFixture() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const f = await Fixture.findOne({ fixtureId: 1508056 }).lean();
        
        if (f) {
            console.log("\nFixture ID:", f.fixtureId);
            console.log("Match:", f.fixture?.teams?.home?.name, "vs", f.fixture?.teams?.away?.name);
            console.log("Status:", f.fixture?.fixture?.status?.short, "| Elapsed:", f.fixture?.fixture?.status?.elapsed);
            console.log("Is Live:", f.isLive);
        } else {
            console.log("Fixture not found");
        }
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
        process.exit(0);
    }
}

checkFixture();
