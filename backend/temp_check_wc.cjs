require('dotenv').config({path: './.env'});
const mongoose = require('mongoose');
const Fixture = require('./models/Fixture.js').default;

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const start = new Date('2026-06-11T00:00:00+03:00').getTime();
  const end = start + 86400000;
  
  const wcLeagues = [1, 8, 15, 37, 490, 31, 32, 33, 34, 29, 30, 587, 920, 927, 950, 880, 1186, 1213];
  
  const fixtures = await Fixture.find({
    'fixture.league.id': { $in: wcLeagues },
    'fixture.fixture.timestamp': { $gte: Math.floor(start/1000), $lt: Math.floor(end/1000) }
  }).lean();
  
  console.log('Today WC Fixtures found:', fixtures.length);
  fixtures.forEach(f => {
    console.log(f.fixture.teams.home.name, 'vs', f.fixture.teams.away.name, '| Prediction:', f.prediction || 'NONE');
  });
  
  process.exit(0);
}
check().catch(console.error);
