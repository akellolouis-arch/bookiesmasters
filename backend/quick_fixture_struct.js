import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Fixture = mongoose.model('Fixture', new mongoose.Schema({}, { strict: false }));
  
  const fix = await Fixture.findOne({ 
    "fixture.fixture.date": { $gte: "2026-06-30T00:00:00Z" }
  });
  
  console.log(JSON.stringify(fix, null, 2));
  process.exit();
}
run();
