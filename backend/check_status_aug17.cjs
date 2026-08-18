const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const FixtureSchema = new mongoose.Schema({
  fixtureId: Number,
  fixture: Object,
  predictionTip: String
}, { strict: false });
const Fixture = mongoose.models.Fixture || mongoose.model("Fixture", FixtureSchema);

async function run() {
  await mongoose.connect(MONGO_URI);
  
  // Kenya Date ranges
  const kenyaYmdFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const getKenyaDayStartMs = (ymd) => {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T00:00:00+03:00`).getTime();
  };

  const getKenyaDatePlus = (offsetDays) => {
    const todayYmd = kenyaYmdFormatter.format(new Date());
    const [y, m, d] = todayYmd.split("-").map(Number);
    const base = new Date(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T00:00:00+03:00`);
    const target = new Date(base.getTime() + offsetDays * 86400000);
    return kenyaYmdFormatter.format(target);
  };

  const checkDate = async (offset) => {
    const ymd = getKenyaDatePlus(offset);
    const startMs = getKenyaDayStartMs(ymd);
    const endMs = startMs + 86400000 - 1;
    
    const startIso = new Date(startMs).toISOString();
    const endIso = new Date(endMs).toISOString();
    
    const count = await Fixture.countDocuments({
      "fixture.fixture.date": { $gte: startIso, $lte: endIso }
    });
    const withTips = await Fixture.countDocuments({
      "fixture.fixture.date": { $gte: startIso, $lte: endIso },
      predictionTip: { $exists: true, $ne: "NONE" }
    });
    
    const noneTips = await Fixture.countDocuments({
        "fixture.fixture.date": { $gte: startIso, $lte: endIso },
        predictionTip: "NONE"
    });
    
    console.log(`[${ymd}] (${offset}) Total: ${count}, With Tips: ${withTips}, NONE tips: ${noneTips}`);
  };

  await checkDate(-2);
  await checkDate(-1);
  await checkDate(0);
  await checkDate(1);
  await checkDate(2);

  process.exit(0);
}

run().catch(console.error);
