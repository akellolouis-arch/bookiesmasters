import mongoose from "mongoose";
import dotenv from "dotenv";
import Fixture from "./models/Fixture.js";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";

mongoose.connect(MONGO_URI).then(async () => {
    console.log("Connected.");
    const leagueId = 45;
    const count = await Fixture.countDocuments({ "fixture.league.id": leagueId });
    console.log(`FA Cup (45) Fixtures Count: ${count}`);

    const todays = await Fixture.find({
        "fixture.league.id": leagueId,
        "fixture.fixture.date": { $regex: "2026-01-10" } // simple string check for today
    }).select("fixture.fixture.date fixture.teams.home.name fixture.teams.away.name");

    console.log(`Fixtures for 2026-01-10: ${todays.length}`);
    todays.forEach(f => console.log(`${f.fixture.fixture.date}: ${f.fixture.teams.home.name} vs ${f.fixture.teams.away.name}`));
    process.exit(0);
}).catch(e => console.error(e));
