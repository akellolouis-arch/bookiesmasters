const mongoose = require('mongoose');

const MONGO_URI = "mongodb+srv://emoitakelo_db_user:DfN3yvN0ZJTtrJtw@fixturetips.2wwtn9l.mongodb.net/?appName=fixturetips";

async function checkFixture() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB.");
  
  const fixtureSchema = new mongoose.Schema({}, { strict: false });
  const Fixture = mongoose.models.Fixture || mongoose.model('Fixture', fixtureSchema, 'fixtures');
  
  const f = await Fixture.findOne({ fixtureId: 1457798 }).lean();
  if (!f) {
    console.log("Fixture not found in DB.");
  } else {
    console.log(`DB Fixture ID: ${f.fixtureId}`);
    console.log(`DB Kickoff: ${f.fixture.fixture.date}`);
    console.log(`DB Status: ${f.fixture.fixture.status.short}`);
  }
  
  mongoose.disconnect();
}

checkFixture().catch(console.error);
