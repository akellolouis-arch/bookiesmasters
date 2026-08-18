const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const FixtureSchema = new mongoose.Schema({
  fixtureId: Number,
  fixture: Object,
  predictionTip: String
}, { strict: false });
const Fixture = mongoose.models.Fixture || mongoose.model("Fixture", FixtureSchema);

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const matchDate = "2026-08-17T15:00:00+00:00";
  const homeId = 999999999; // some non-existent team
  
  const explain = await Fixture.find({
      $or: [{ "fixture.teams.home.id": homeId }, { "fixture.teams.away.id": homeId }],
      "fixture.fixture.date": { $lt: matchDate },
      "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
  }).sort({ "fixture.fixture.date": -1 }).limit(5).explain("executionStats");
  
  console.log(JSON.stringify(explain.executionStats, null, 2));
  process.exit(0);
}

run().catch(console.error);
