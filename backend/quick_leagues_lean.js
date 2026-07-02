import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Fixture = mongoose.model('Fixture', new mongoose.Schema({}, { strict: false }));
  
  // Find all World Cup fixtures around this time
  const fixs = await Fixture.find({ 
    "fixture.fixture.date": { $gte: "2026-06-29T00:00:00Z", $lte: "2026-07-04T23:59:59Z" }
  }).lean();
  
  const leagues = {};
  for (const f of fixs) {
    const lName = f.fixture?.league?.name || 'Unknown';
    leagues[lName] = (leagues[lName] || 0) + 1;
  }
  
  console.log('Leagues with matches on June 29 - July 4:');
  for (const l in leagues) {
    console.log(`- ${l}: ${leagues[l]} matches`);
  }
  
  process.exit();
}
run();
