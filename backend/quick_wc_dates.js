import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Fixture = mongoose.model('Fixture', new mongoose.Schema({}, { strict: false }));
  
  const wcFixs = await Fixture.find({ 
    "fixture.league.name": "World Cup",
    "fixture.fixture.date": { $gte: "2026-06-29T00:00:00Z", $lte: "2026-07-04T23:59:59Z" }
  }).lean();
  
  console.log(`Found ${wcFixs.length} World Cup matches`);
  for (const f of wcFixs) {
    console.log(`- ${f.fixture.fixture.date}: ${f.fixture.teams.home.name} vs ${f.fixture.teams.away.name} | Tip: ${f.predictionTip} | Status: ${f.fixture.fixture.status.short}`);
  }
  
  process.exit();
}
run();
