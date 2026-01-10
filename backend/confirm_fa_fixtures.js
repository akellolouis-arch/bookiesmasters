import mongoose from "mongoose";
import dotenv from "dotenv";
import Fixture from "./models/Fixture.js";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";

mongoose.connect(MONGO_URI).then(async () => {
    const leagueId = 45; // FA Cup
    const todayStr = "2026-01-10"; // Today's date in user's context

    console.log(`\n🔎 Checking MongoDB for FA Cup (ID: ${leagueId}) fixtures on ${todayStr}...\n`);

    const fixtures = await Fixture.find({
        "fixture.league.id": leagueId,
        "fixture.fixture.date": { $regex: todayStr }
    }).select("fixture.teams.home.name fixture.teams.away.name fixture.fixture.date odds");

    if (fixtures.length === 0) {
        console.log("❌ No fixtures found in DB.");
    } else {
        console.log(`✅ Found ${fixtures.length} fixtures in the database:`);
        console.log("---------------------------------------------------");
        fixtures.forEach((f, i) => {
            const hasOdds = f.odds && f.odds.length > 0;
            console.log(`${i + 1}. ${f.fixture.teams.home.name} vs ${f.fixture.teams.away.name}`);
            console.log(`   🕒 Time: ${f.fixture.fixture.date.split('T')[1].slice(0, 5)} | 🎲 Odds Available: ${hasOdds ? "YES ✅" : "NO ❌"}`);
        });
        console.log("---------------------------------------------------");
    }

    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
