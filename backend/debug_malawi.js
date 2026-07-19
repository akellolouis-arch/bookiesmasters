import mongoose from "mongoose";
import dotenv from "dotenv";
import Fixture from "./models/Fixture.js";


dotenv.config({ path: ".env.local" });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const fixtures = await Fixture.find({ 
    "fixture.league.country": /Malawi/i
  }).sort({ "fixture.fixture.date": -1 }).limit(10);

  console.log(`Found ${fixtures.length} Malawi fixtures.`);
  for (const f of fixtures) {
    const fix = f.fixture;
    if (!fix) continue;
    const date = fix.fixture?.date;
    const status = fix.fixture?.status?.short;
    const scoreHome = fix.score?.fulltime?.home ?? fix.goals?.home;
    const scoreAway = fix.score?.fulltime?.away ?? fix.goals?.away;
    const homeTeam = fix.teams?.home?.name;
    const awayTeam = fix.teams?.away?.name;
    
    console.log(`ID: ${f.fixtureId}, Date: ${date}, Status: ${status}, Score: ${scoreHome}-${scoreAway}, Teams: ${homeTeam} vs ${awayTeam}`);
  }

  process.exit(0);
}
run();
