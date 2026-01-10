import mongoose from "mongoose";
import dotenv from "dotenv";
import Fixture from "./models/Fixture.js";
import League from "./models/League.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";

async function verify() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // 1. Check League
        const leagueId = 45; // FA Cup
        const league = await League.findOne({ "league.id": leagueId });
        if (league) {
            console.log(`✅ League Found: ${league.league.name} (ID: ${league.league.id})`);
            console.log(`   Active: ${league.active}`);
            console.log(`   Seasons: ${league.seasons.length} seasons stored`);
        } else {
            console.log("❌ League 45 NOT FOUND in 'leagues' collection.");
        }

        // 2. Check Fixtures
        // Check for ANY FA Cup fixtures
        const count = await Fixture.countDocuments({ "fixture.league.id": leagueId });
        console.log(`📊 Total FA Cup fixtures in DB: ${count}`);

        // Check for TODAY's fixtures (using string matching on date part or iso)
        const today = new Date().toISOString().split('T')[0];
        console.log(`🔎 Searching for fixtures with date string containing: ${today}`);

        // We can also check the 'fixture.fixture.date' field directly
        // The previous script saved them. Let's list a few dates.
        const fixtures = await Fixture.find({ "fixture.league.id": leagueId }).limit(5);
        if (fixtures.length > 0) {
            console.log("📝 Sample Fixture Dates:");
            fixtures.forEach(f => {
                console.log(`   - ${f.fixture.fixture.date} (Status: ${f.fixture.fixture.status.short})`);
            });
        }

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        mongoose.disconnect();
    }
}

verify();
