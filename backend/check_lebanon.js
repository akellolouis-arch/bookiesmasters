import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Fixture from "./models/Fixture.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

async function findStuckGames() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB connected");

        const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });

        const fixtures = await Fixture.find({ 
            "fixture.fixture.date": { $regex: `^${today}` }
        });

        const stuckGames = fixtures.filter(f => {
            const short = f.fixture?.fixture?.status?.short;
            const elapsed = f.fixture?.fixture?.status?.elapsed;
            const matchDateStr = f.fixture?.fixture?.date;
            if (!matchDateStr) return false;
            
            const matchTime = new Date(matchDateStr).getTime();
            const now = new Date().getTime();
            
            // If match started more than 2 hours ago (7200000 ms) and is still live/HT
            const isOld = now - matchTime > 2 * 60 * 60 * 1000;
            const isLiveStatus = ["1H", "HT", "2H", "LIVE", "ET", "P"].includes(short) || elapsed === 45 || f.isLive === true;
            
            return isOld && isLiveStatus;
        });

        console.log(`Found ${stuckGames.length} REALLY stuck matches (started >2hrs ago).`);

        for (const f of stuckGames) {
            console.log("\n-------------------------");
            console.log("Fixture ID:", f.fixtureId);
            console.log("League:", f.fixture?.league?.name, "in", f.fixture?.league?.country);
            console.log("Match:", f.fixture?.teams?.home?.name, "vs", f.fixture?.teams?.away?.name);
            console.log("Status:", f.fixture?.fixture?.status?.short, "| Elapsed:", f.fixture?.fixture?.status?.elapsed);
            console.log("Date:", f.fixture?.fixture?.date);
            console.log("Updated At:", f.updatedAt);
        }

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
}

findStuckGames();
