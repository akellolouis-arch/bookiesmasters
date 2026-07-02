import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Fixture = mongoose.model('Fixture', new mongoose.Schema({}, { strict: false }));
  
  const leagues = await Fixture.distinct("fixture.league.name", { 
    "fixture.fixture.date": { $gte: "2026-06-29T00:00:00Z", $lte: "2026-07-04T23:59:59Z" }
  });
  
  console.log('Leagues with matches on June 29 - July 4:', leagues);
  
  process.exit();
}
run();
