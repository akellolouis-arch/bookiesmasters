import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Fixture from "./models/Fixture.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

async function checkGambia() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
        
        const fixtures = await Fixture.find({ 
            "fixture.league.name": /GFA/i,
            "fixture.fixture.date": { $regex: `^${today}` }
        }).lean();

        for (const f of fixtures) {
            console.log("\nFixture ID:", f.fixtureId);
            console.log("Match:", f.fixture?.teams?.home?.name, "vs", f.fixture?.teams?.away?.name);
            console.log("Status:", f.fixture?.fixture?.status?.short, "| Elapsed:", f.fixture?.fixture?.status?.elapsed);
            console.log("Date:", f.fixture?.fixture?.date);
        }
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
        process.exit(0);
    }
}

checkGambia();
