import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Fixture from "../models/Fixture.js";
import { formatFixtureCard } from "../helpers/fixtureFormatter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

function getDatePlus(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function pickResultFromGoals(goalsHome, goalsAway) {
  if (goalsHome == null || goalsAway == null) return null;
  if (goalsHome > goalsAway) return "1";
  if (goalsHome < goalsAway) return "2";
  return "X";
}

function isTipCorrect(tip, result) {
  if (!tip || tip === "N/A" || !result) return null;
  if (tip === "1") return result === "1";
  if (tip === "2") return result === "2";
  if (tip === "1X") return result === "1" || result === "X";
  if (tip === "X2") return result === "X" || result === "2";
  return null;
}

function pct(wins, total) {
  if (!total) return "0.00%";
  return `${((wins / total) * 100).toFixed(2)}%`;
}

async function scoreDate(date) {
  const start = new Date(`${date}T00:00:00.000Z`).toISOString();
  const end = new Date(`${date}T23:59:59.999Z`).toISOString();

  const docs = await Fixture.find({
    "fixture.fixture.date": { $gte: start, $lte: end },
    "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] },
  }).lean();

  const rows = docs.map((d) => {
    const card = formatFixtureCard(d);
    const g = d.fixture?.goals;
    const result = pickResultFromGoals(g?.home, g?.away);
    const correct = isTipCorrect(card.prediction, result);
    return { tip: card.prediction, result, correct };
  });

  const totalFinished = rows.length;
  const withTip = rows.filter((r) => r.tip && r.tip !== "N/A");
  const scorable = withTip.filter((r) => r.correct !== null);
  const wins = scorable.filter((r) => r.correct === true).length;

  const byTip = {};
  for (const r of scorable) {
    const key = r.tip;
    if (!byTip[key]) byTip[key] = { total: 0, wins: 0 };
    byTip[key].total += 1;
    if (r.correct) byTip[key].wins += 1;
  }

  return {
    date,
    totalFinished,
    withTip: withTip.length,
    scorable: scorable.length,
    wins,
    winRate: pct(wins, scorable.length),
    byTip,
  };
}

async function main() {
  const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";
  await mongoose.connect(MONGO_URI);

  const days = Number(process.env.DAYS || "7");
  const perDay = [];
  for (let offset = -1; offset >= -days; offset--) {
    const date = getDatePlus(offset);
    // eslint-disable-next-line no-await-in-loop
    perDay.push(await scoreDate(date));
  }

  const totals = perDay.reduce(
    (acc, d) => {
      acc.totalFinished += d.totalFinished;
      acc.withTip += d.withTip;
      acc.scorable += d.scorable;
      acc.wins += d.wins;
      for (const [tip, v] of Object.entries(d.byTip)) {
        if (!acc.byTip[tip]) acc.byTip[tip] = { total: 0, wins: 0 };
        acc.byTip[tip].total += v.total;
        acc.byTip[tip].wins += v.wins;
      }
      return acc;
    },
    { totalFinished: 0, withTip: 0, scorable: 0, wins: 0, byTip: {} }
  );

  console.log(`DAYS=${days}`);
  for (const d of perDay) {
    console.log(
      `DATE=${d.date} FINISHED=${d.totalFinished} SCORABLE=${d.scorable} WINS=${d.wins} WIN_RATE=${d.winRate}`
    );
  }

  console.log("---");
  console.log(`TOTAL_FINISHED=${totals.totalFinished}`);
  console.log(`TOTAL_SCORABLE=${totals.scorable}`);
  console.log(`TOTAL_WINS=${totals.wins}`);
  console.log(`TOTAL_WIN_RATE=${pct(totals.wins, totals.scorable)}`);
  console.log("TOTAL_BY_TIP=" + JSON.stringify(totals.byTip, null, 2));

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

