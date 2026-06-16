import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Fixture from "./models/Fixture.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

async function fixFixture() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const f = await Fixture.findOne({ fixtureId: 1508056 });
        
        if (f) {
            console.log("\nFound Fixture ID:", f.fixtureId);
            
            // Force it to FT
            f.fixture.fixture.status.long = "Match Finished";
            f.fixture.fixture.status.short = "FT";
            f.fixture.fixture.status.elapsed = 90;
            
            f.status = "FT";
            f.isLive = false;
            
            f.markModified('fixture');
            await f.save();
            
            console.log("✅ Successfully forced Tadamon Sour vs Al Mabarrah to FT in DB!");
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

fixFixture();
