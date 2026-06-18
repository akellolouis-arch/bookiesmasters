const mongoose = require('mongoose');
const Fixture = require('./backend/models/Fixture').default || require('./backend/models/Fixture');

async function checkFixture() {
  await mongoose.connect('mongodb+srv://emoitakelo_db_user:DfN3yvN0ZJTtrJtw@fixturetips.2wwtn9l.mongodb.net/?appName=fixturetips');
  const startOfDay = new Date();
  startOfDay.setUTCHours(0,0,0,0);
  const endOfDay = new Date();
  endOfDay.setUTCHours(23,59,59,999);

  const fixture = await Fixture.findOne({
    date: { $gte: startOfDay, $lte: endOfDay },
    $or: [
      { 'home.name': /Simba/i },
      { 'away.name': /KMC/i }
    ]
  });

  if (fixture) {
    console.log(JSON.stringify(fixture, null, 2));
  } else {
    console.log('Fixture not found for today.');
  }
  process.exit(0);
}

checkFixture();
