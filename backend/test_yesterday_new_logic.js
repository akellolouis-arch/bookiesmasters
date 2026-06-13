import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Fixture from "./models/Fixture.js";
import { generateCustomBinaryPrediction } from "./helpers/dbPredictionEngine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local"), override: true });

function getKenyaDatePlus(offsetDays) {
  const KENYA_TZ = "Africa/Nairobi";
  const kenyaYmdFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: KENYA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayYmd = kenyaYmdFormatter.format(new Date());
  const [y, m, d] = todayYmd.split("-").map(Number);
  const base = new Date(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T00:00:00+03:00`);
  const target = new Date(base.getTime() + offsetDays * 86400000);
  return kenyaYmdFormatter.format(target);
}

function isTipCorrect(tip, goalsHome, goalsAway) {
  if (!tip || tip === "NONE" || goalsHome == null || goalsAway == null) return null;
  const t = tip.toUpperCase().replace(/\s+/g, '');
  const totalGoals = goalsHome + goalsAway;
  if (t === "OV1.5" || t === "OVER1.5") return totalGoals > 1.5;
  if (t === "UN3.5" || t === "UNDER3.5") return totalGoals < 3.5;
  return null;
}

async function testYesterdayNewLogic() {
  const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB\n");

  const yesterdayDate = getKenyaDatePlus(-1);
  const start = new Date(`${yesterdayDate}T00:00:00+03:00`).toISOString();
  const end = new Date(`${yesterdayDate}T23:59:59.999+03:00`).toISOString();

  console.log(`Analyzing matches for ${yesterdayDate}...`);

  const docs = await Fixture.find({
    "fixture.fixture.date": { $gte: start, $lte: end },
    "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] },
  }).lean();

  let predictionsCount = 0;
  let correctCount = 0;
  const byTip = {};

  for (const doc of docs) {
    const matchDate = doc.fixture.fixture.date;
    const homeId = doc.fixture.teams.home.id;
    const awayId = doc.fixture.teams.away.id;

    // Fetch the 5 matches PRIOR to this match's kickoff time
    const homeMatches = await Fixture.find({
        $or: [{ "fixture.teams.home.id": homeId }, { "fixture.teams.away.id": homeId }],
        "fixture.fixture.date": { $lt: matchDate },
        "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
    }).sort({ "fixture.fixture.date": -1 }).limit(5).lean();

    const awayMatches = await Fixture.find({
        $or: [{ "fixture.teams.home.id": awayId }, { "fixture.teams.away.id": awayId }],
        "fixture.fixture.date": { $lt: matchDate },
        "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
    }).sort({ "fixture.fixture.date": -1 }).limit(5).lean();

    const tip = generateCustomBinaryPrediction(homeMatches, awayMatches);
    
    if (tip && tip !== "NONE") {
      const g = doc.fixture?.goals;
      const correct = isTipCorrect(tip, g?.home, g?.away);
      
      predictionsCount++;
      if (correct) correctCount++;
      
      if (!byTip[tip]) byTip[tip] = { total: 0, wins: 0 };
      byTip[tip].total++;
      if (correct) byTip[tip].wins++;
    }
  }

  console.log(`\n--- RESULTS FOR YESTERDAY (${yesterdayDate}) WITH NEW LOGIC ---`);
  console.log(`TOTAL FINISHED MATCHES: ${docs.length}`);
  console.log(`MATCHES PREDICTED (OV1.5 / UN3.5): ${predictionsCount}`);
  if (predictionsCount > 0) {
    console.log(`CORRECT PREDICTIONS: ${correctCount}`);
    console.log(`WIN RATE: ${((correctCount / predictionsCount) * 100).toFixed(2)}%`);
    console.log(`\nBREAKDOWN BY TIP:`);
    console.log(JSON.stringify(byTip, null, 2));
  } else {
    console.log(`WIN RATE: N/A`);
  }

  await mongoose.disconnect();
}

testYesterdayNewLogic().catch(e => {
  console.error(e);
  process.exit(1);
});
