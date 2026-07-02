import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Fixture = mongoose.model('Fixture', new mongoose.Schema({}, { strict: false }));
  
  const f = await Fixture.findOne({ 
    "fixture.teams.home.name": "England",
    "fixture.teams.away.name": "Congo DR"
  }).lean();
  
  if (f) {
    console.log(`Fixture ID: ${f.fixtureId}`);
    console.log(`Updated At: ${f.updatedAt}`);
    console.log(`Prediction Tip: ${f.predictionTip}`);
    console.log(`Goals: `, f.fixture.goals);
  }
  
  process.exit();
}
run();
