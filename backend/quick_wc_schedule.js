import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Fixture = mongoose.model('Fixture', new mongoose.Schema({}, { strict: false }));
  
  // Find all World Cup fixtures around this time
  const wcFixs = await Fixture.find({ 
    "fixture.fixture.date": { $gte: "2026-06-29T00:00:00Z", $lte: "2026-07-04T23:59:59Z" }
  });
  
  const wc = wcFixs.filter(f => f.fixture?.league?.name?.toLowerCase().includes('world cup'));
  console.log(`World Cup matches found: ${wc.length}`);
  
  for(const f of wc) {
    console.log(`[${f.fixture.fixture.date}] ${f.fixture.teams.home.name} vs ${f.fixture.teams.away.name}`);
  }
  process.exit();
}
run();
