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

const calculateStats = (matches, limit) => {
  const recent = matches.slice(0, limit);
  let stats = { total: 0, over25: 0, under25: 0 };

  recent.forEach((m) => {
      const homeGoals = m.fixture?.goals?.home ?? m.fixture?.score?.fulltime?.home;
      const awayGoals = m.fixture?.goals?.away ?? m.fixture?.score?.fulltime?.away;
      if (homeGoals !== undefined && homeGoals !== null && awayGoals !== undefined && awayGoals !== null) {
          const totalGoals = homeGoals + awayGoals;
          stats.total++;
          if (totalGoals > 2.5) stats.over25++; else stats.under25++;
      }
  });

  return stats;
};

async function checkToday() {
  const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";
  await mongoose.connect(MONGO_URI);

  const todayDate = getKenyaDatePlus(0); // Today
  const start = new Date(`${todayDate}T00:00:00+03:00`).toISOString();
  const end = new Date(`${todayDate}T23:59:59.999+03:00`).toISOString();

  const docs = await Fixture.find({
    "fixture.fixture.date": { $gte: start, $lte: end },
  }).lean();

  let predictionsCount = 0;
  let totalValid = 0;

  for (const doc of docs) {
    const matchDate = doc.fixture.fixture.date;
    const homeId = doc.fixture.teams.home.id;
    const awayId = doc.fixture.teams.away.id;

    const [homeMatches, awayMatches] = await Promise.all([
      Fixture.find({
          $or: [{ "fixture.teams.home.id": homeId }, { "fixture.teams.away.id": homeId }],
          "fixture.fixture.date": { $lt: matchDate },
          "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
      }).sort({ "fixture.fixture.date": -1 }).limit(5).lean(),
      Fixture.find({
          $or: [{ "fixture.teams.home.id": awayId }, { "fixture.teams.away.id": awayId }],
          "fixture.fixture.date": { $lt: matchDate },
          "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
      }).sort({ "fixture.fixture.date": -1 }).limit(5).lean()
    ]);

    const homeStats = calculateStats(homeMatches, 5);
    const awayStats = calculateStats(awayMatches, 5);

    let tip = "NONE";

    if (homeStats.total >= 4 && awayStats.total >= 4) {
      totalValid++;
      const passOV15 = homeStats.over25 >= 4 && awayStats.over25 >= 4;
      const passUN35 = homeStats.under25 >= 4 && awayStats.under25 >= 4;

      if (passOV15) {
          tip = "OV1.5";
      } else if (passUN35) {
          tip = "UN3.5";
      }
    }

    if (tip !== "NONE") {
      predictionsCount++;
      console.log(`[PASS] ${doc.fixture.teams.home.name} vs ${doc.fixture.teams.away.name} => ${tip}`);
    }
  }

  console.log(`\n--- TODAY'S PREDICTIONS (${todayDate}) ---`);
  console.log(`Total Matches Found: ${docs.length}`);
  console.log(`Matches With Enough History (>= 4 matches): ${totalValid}`);
  console.log(`Matches Passing Strict Filter: ${predictionsCount}`);

  await mongoose.disconnect();
}

checkToday().catch(console.error);
