
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Fixture from "../models/Fixture.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB connected");

        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        console.log(`Checking matches for today: ${startOfDay.toISOString()} - ${endOfDay.toISOString()}`);

        // Find matches for today that are NOT finished in our DB
        // We expect some to be finished.

        // 1. Check all matches for today
        const count = await Fixture.countDocuments({
            "fixture.fixture.date": { $gte: startOfDay.toISOString(), $lte: endOfDay.toISOString() }
        });
        console.log(`Total matches in DB for today: ${count}`);

        // 2. Check "Live" matches (according to DB)
        const liveMatches = await Fixture.find({
            "fixture.fixture.date": { $gte: startOfDay.toISOString(), $lte: endOfDay.toISOString() },
            "fixture.fixture.status.short": { $nin: ["FT", "AET", "PEN", "PST", "CANC", "ABD", "AWD", "WO", "NS"] }
        }).select("fixtureId fixture.fixture.status fixture.score.fulltime fixture.league.name");

        console.log(`\nFound ${liveMatches.length} matches marked as LIVE/IN-PLAY in DB:`);
        liveMatches.forEach(m => {
            console.log(`[${m.fixtureId}] ${m.fixture.league.name} - Status: ${m.fixture.fixture.status.short} (${m.fixture.fixture.status.elapsed}')`);
        });

        // 3. Check specific "Finished" matches that might be stuck
        // (We rely on user report, but listing above should show them if they exist)

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
