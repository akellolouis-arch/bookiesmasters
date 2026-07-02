import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkWC() {
  await mongoose.connect(process.env.MONGO_URI);
  const League = mongoose.model('League', new mongoose.Schema({}, { strict: false }));
  const wcs = await League.find({ 'league.name': /World Cup/i });
  console.log('World Cup Leagues:', wcs.map(w => w.league.name + ' (' + w.league.id + ')'));
  
  const Fixture = mongoose.model('Fixture', new mongoose.Schema({}, { strict: false }));
  const wcIds = wcs.map(w => w.league.id);
  const wcFixs = await Fixture.find({ 'fixture.league.id': { $in: wcIds } });
  console.log('Total WC fixtures:', wcFixs.length);
  const wcToday = wcFixs.filter(f => f.fixture?.fixture?.date?.includes('2026-07-01'));
  console.log('WC Fixtures Today (July 1st):', wcToday.length);
  if (wcToday.length > 0) {
    for (const f of wcToday) {
      console.log('Fixture:', f.fixture.teams.home.name, 'vs', f.fixture.teams.away.name);
      console.log('Status:', f.fixture.fixture.status.short);
      const isPredicted = !!f.prediction;
      console.log('Predicted field exists?:', isPredicted);
      if (f.prediction) {
        console.log('Prediction tip:', f.prediction.tip);
      }
    }
  }

  const wcYest = wcFixs.filter(f => f.fixture?.fixture?.date?.includes('2026-06-30'));
  console.log('WC Fixtures Yesterday (June 30th):', wcYest.length);
  if (wcYest.length > 0) {
    for (const f of wcYest) {
      console.log('Fixture:', f.fixture.teams.home.name, 'vs', f.fixture.teams.away.name, !!f.prediction ? f.prediction.tip : 'No prediction');
    }
  }
  process.exit();
}
checkWC().catch(console.error);
