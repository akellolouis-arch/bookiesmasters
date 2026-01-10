import mongoose from "mongoose";
import dotenv from "dotenv";
import Fixture from "./models/Fixture.js";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";

mongoose.connect(MONGO_URI).then(async () => {
    console.log("Connected.");
    const leagueId = 45;

    const fixtures = await Fixture.find({
        "fixture.league.id": leagueId,
        "fixture.fixture.date": { $regex: "2026-01-10" }
    });

    console.log(`Found ${fixtures.length} fixtures for FA Cup today.`);
    let withOdds = 0;
    fixtures.forEach(f => {
        const hasOdds = f.odds && f.odds.length > 0;
        if (hasOdds) withOdds++;
        console.log(`- ${f.fixture.teams.home.name} vs ${f.fixture.teams.away.name}: Odds? ${hasOdds ? "✅" : "❌"}`);
    });

    console.log(`Total with odds: ${withOdds} / ${fixtures.length}`);
    process.exit(0);
}).catch(e => console.error(e));
