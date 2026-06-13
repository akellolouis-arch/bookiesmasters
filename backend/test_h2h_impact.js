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

async function testH2HLogic() {
  const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";
  await mongoose.connect(MONGO_URI);

  const yesterdayDate = getKenyaDatePlus(-1);
  const start = new Date(`${yesterdayDate}T00:00:00+03:00`).toISOString();
  const end = new Date(`${yesterdayDate}T23:59:59.999+03:00`).toISOString();

  const docs = await Fixture.find({
    "fixture.fixture.date": { $gte: start, $lte: end },
    "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] },
  }).lean();

  let predictionsWithH2H = 0;
  let correctWithH2H = 0;

  let predictionsWithoutH2H = 0;
  let correctWithoutH2H = 0;

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

    let tipWithH2H = "NONE";
    let tipWithoutH2H = "NONE";

    if (homeStats.total >= 4 && awayStats.total >= 4) {
      const homePassOV15 = homeStats.over15 >= 4;
      const awayPassOV15 = awayStats.over15 >= 4;
      const h2hPassOV15 = h2hStats.total > 0 ? (h2hStats.over15 / h2hStats.total) >= 0.6 : true;
      
      const homePassUN35 = homeStats.under35 >= 4;
      const awayPassUN35 = awayStats.under35 >= 4;
      const h2hPassUN35 = h2hStats.total > 0 ? (h2hStats.under35 / h2hStats.total) >= 0.6 : true;

      // Logic With H2H
      if ((homePassOV15 && awayPassOV15 && h2hPassOV15)) { tipWithH2H = "OV1.5"; }
      else if ((homePassUN35 && awayPassUN35 && h2hPassUN35)) { tipWithH2H = "UN3.5"; }

      // Logic Without H2H
      if ((homePassOV15 && awayPassOV15)) { tipWithoutH2H = "OV1.5"; }
      else if ((homePassUN35 && awayPassUN35)) { tipWithoutH2H = "UN3.5"; }
    }

    const g = doc.fixture?.goals;

    if (tipWithH2H !== "NONE") {
      predictionsWithH2H++;
      if (isTipCorrect(tipWithH2H, g?.home, g?.away)) correctWithH2H++;
    }

    if (tipWithoutH2H !== "NONE") {
      predictionsWithoutH2H++;
      if (isTipCorrect(tipWithoutH2H, g?.home, g?.away)) correctWithoutH2H++;
    }
  }

  console.log(`\n--- WITH H2H INCLUDED ---`);
  console.log(`Predictions: ${predictionsWithH2H}`);
  console.log(`Correct: ${correctWithH2H}`);
  console.log(`Win Rate: ${((correctWithH2H/predictionsWithH2H)*100).toFixed(2)}%`);

  console.log(`\n--- WITHOUT H2H INCLUDED ---`);
  console.log(`Predictions: ${predictionsWithoutH2H}`);
  console.log(`Correct: ${correctWithoutH2H}`);
  console.log(`Win Rate: ${((correctWithoutH2H/predictionsWithoutH2H)*100).toFixed(2)}%`);

  await mongoose.disconnect();
}

testH2HLogic().catch(console.error);
