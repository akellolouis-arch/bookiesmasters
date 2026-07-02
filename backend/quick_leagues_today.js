import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Fixture = mongoose.model('Fixture', new mongoose.Schema({}, { strict: false }));
  
  const fixs = await Fixture.find({ 
    "fixture.fixture.date": { $gte: "2026-06-30T00:00:00Z", $lte: "2026-07-01T23:59:59Z" }
  });
  
  const leagues = {};
  for (const f of fixs) {
    const lName = f.fixture?.league?.name || 'Unknown';
    leagues[lName] = (leagues[lName] || 0) + 1;
  }
  
  console.log('Leagues with matches on June 30 - July 1st:');
  for (const l in leagues) {
    console.log(`- ${l}: ${leagues[l]} matches`);
  }
  
  process.exit();
}
run();
