import mongoose from "mongoose";
import dotenv from "dotenv";
import Fixture from "./models/Fixture.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";

async function debugLiveOdds() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("🔌 Connected to MongoDB");

        // Find matches that are supposedly live
        const liveMatches = await Fixture.find({
            "fixture.fixture.status.short": { $in: ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"] }
        }).select("fixtureId fixture.fixture.status.short liveOdds odds");

        console.log(`🔎 Found ${liveMatches.length} live matches in DB.`);

        if (liveMatches.length === 0) {
            console.log("No live matches found to check.");
            // Optional: Check if there are ANY matches today to ensure DB isn't empty
            const today = new Date().toISOString().split('T')[0];
            const count = await Fixture.countDocuments({ "fixture.fixture.date": { $regex: today } });
            console.log(`(Total matches for today: ${count})`);
        }

        for (const m of liveMatches) {
            console.log(`\n⚽ Match ${m.fixtureId} [${m.fixture.fixture.status.short}]`);

            if (m.liveOdds && m.liveOdds.length > 0) {
                console.log("   ✅ Has Live Odds:", JSON.stringify(m.liveOdds[0].markets, null, 2));
            } else {
                console.log("   ❌ NO Live Odds. (Has Pre-match match odds? " + (m.odds && m.odds.length > 0 ? "Yes" : "No") + ")");
            }
        }

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

debugLiveOdds();
