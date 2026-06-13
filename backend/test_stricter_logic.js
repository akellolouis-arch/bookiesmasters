import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Fixture from "./models/Fixture.js";

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

const calculateStats = (matches, limit) => {
  const recent = matches.slice(0, limit);
  let stats = { total: 0, over15: 0, under15: 0, over25: 0, under25: 0, over35: 0, under35: 0 };

  recent.forEach((m) => {
      const homeGoals = m.fixture?.goals?.home ?? m.fixture?.score?.fulltime?.home;
      const awayGoals = m.fixture?.goals?.away ?? m.fixture?.score?.fulltime?.away;
      if (homeGoals !== undefined && homeGoals !== null && awayGoals !== undefined && awayGoals !== null) {
          const totalGoals = homeGoals + awayGoals;
          stats.total++;
          if (totalGoals > 1.5) stats.over15++; else stats.under15++;
          if (totalGoals > 2.5) stats.over25++; else stats.under25++;
          if (totalGoals > 3.5) stats.over35++; else stats.under35++;
      }
  });

  return stats;
};

async function testStricterLogic() {
  const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";
  await mongoose.connect(MONGO_URI);

  const yesterdayDate = getKenyaDatePlus(-1);
  const start = new Date(`${yesterdayDate}T00:00:00+03:00`).toISOString();
  const end = new Date(`${yesterdayDate}T23:59:59.999+03:00`).toISOString();

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

    const [homeMatches, awayMatches, h2hMatches] = await Promise.all([
      Fixture.find({
          $or: [{ "fixture.teams.home.id": homeId }, { "fixture.teams.away.id": homeId }],
          "fixture.fixture.date": { $lt: matchDate },
          "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
      }).sort({ "fixture.fixture.date": -1 }).limit(5).lean(),
      Fixture.find({
          $or: [{ "fixture.teams.home.id": awayId }, { "fixture.teams.away.id": awayId }],
          "fixture.fixture.date": { $lt: matchDate },
          "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
      }).sort({ "fixture.fixture.date": -1 }).limit(5).lean(),
      Fixture.find({
          $or: [
              { "fixture.teams.home.id": homeId, "fixture.teams.away.id": awayId },
              { "fixture.teams.home.id": awayId, "fixture.teams.away.id": homeId }
          ],
          "fixture.fixture.date": { $lt: matchDate },
          "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
      }).sort({ "fixture.fixture.date": -1 }).limit(5).lean()
    ]);

    const homeStats = calculateStats(homeMatches, 5);
    const awayStats = calculateStats(awayMatches, 5);
    const h2hStats = calculateStats(h2hMatches, 5);

    let tip = "NONE";

    if (homeStats.total >= 4 && awayStats.total >= 4) {
      // USING THE OVER 2.5 / UNDER 2.5 LOGIC FOR PREDICTIONS
      const homePassOV25 = homeStats.over25 >= 4;
      const awayPassOV25 = awayStats.over25 >= 4;
      const h2hPassOV25 = h2hStats.total > 0 ? (h2hStats.over25 / h2hStats.total) >= 0.6 : true;
      
      const homePassUN25 = homeStats.under25 >= 4;
      const awayPassUN25 = awayStats.under25 >= 4;
      const h2hPassUN25 = h2hStats.total > 0 ? (h2hStats.under25 / h2hStats.total) >= 0.6 : true;

      const passOV15 = homePassOV25 && awayPassOV25;
      const passUN35 = homePassUN25 && awayPassUN25;

      if (passOV15) {
          tip = "OV1.5";
      } else if (passUN35) {
          tip = "UN3.5";
      }
    }

    const g = doc.fixture?.goals;

    if (tip !== "NONE") {
      predictionsCount++;
      const correct = isTipCorrect(tip, g?.home, g?.away);
      if (correct) correctCount++;
      
      if (!byTip[tip]) byTip[tip] = { total: 0, wins: 0 };
      byTip[tip].total++;
      if (correct) byTip[tip].wins++;
    }
  }

  console.log(`\n--- WITH STRICT SAFETY NET (OV2.5 for OV1.5 | UN2.5 for UN3.5) ---`);
  console.log(`Total Matches Analysed: ${docs.length}`);
  console.log(`Predictions: ${predictionsCount}`);
  if (predictionsCount > 0) {
      console.log(`Correct: ${correctCount}`);
      console.log(`Win Rate: ${((correctCount/predictionsCount)*100).toFixed(2)}%`);
      console.log(`\nBREAKDOWN BY TIP:`);
      console.log(JSON.stringify(byTip, null, 2));
  } else {
      console.log(`Win Rate: N/A (0 matches passed the strict criteria)`);
  }

  await mongoose.disconnect();
}

testStricterLogic().catch(console.error);
