import mongoose from "mongoose";
import Fixture from "./backend/models/Fixture.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const tomorrowStr = "2026-07-29";
  const startOfDayKenya = new Date(`${tomorrowStr}T00:00:00+03:00`);
  const endOfDayKenya = new Date(`${tomorrowStr}T23:59:59.999+03:00`);

  console.log("Checking for dates:", startOfDayKenya.toISOString(), "to", endOfDayKenya.toISOString());

  const fixtures = await Fixture.find({ 
    "fixture.fixture.date": { $gte: startOfDayKenya.toISOString(), $lt: endOfDayKenya.toISOString() }
  });
  
  console.log(`Total fixtures for tomorrow: ${fixtures.length}`);
  
  const predicted = fixtures.filter(f => f.prediction && f.prediction !== 'N/A' && f.prediction !== 'none');
  
  console.log(`Predicted fixtures for tomorrow: ${predicted.length}`);
  for(const f of predicted) {
     console.log(`${f.fixture.teams.home.name} vs ${f.fixture.teams.away.name} -> ${f.prediction} (${f.fixture.league.name})`);
  }
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
