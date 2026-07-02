import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Fixture = mongoose.model('Fixture', new mongoose.Schema({}, { strict: false }));
  
  // Find all World Cup fixtures for July 1st 2026
  const wcFixs = await Fixture.find({ 
    "fixture.fixture.date": { $gte: "2026-07-01T00:00:00Z", $lte: "2026-07-01T23:59:59Z" }
  });
  
  console.log(`Total matches on July 1st: ${wcFixs.length}`);
  const wc = wcFixs.filter(f => f.fixture?.league?.name?.toLowerCase().includes('world cup'));
  console.log(`World Cup matches: ${wc.length}`);
  
  for(const f of wc) {
    console.log(`[${f.fixture.league.name}] ${f.fixture.teams.home.name} vs ${f.fixture.teams.away.name} | predictionTip: ${f.predictionTip} | Status: ${f.fixture.fixture.status.short}`);
  }
  process.exit();
}
run();
