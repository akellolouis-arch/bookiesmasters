/**
 * Win rate from current-week Monday through today (Africa/Nairobi),
 * only tips 1 and 1X (same resolution as formatFixtureCard + customPrediction).
 *
 *   node backend/scripts/win_rate_monday_to_today_1_1x.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Fixture from "../models/Fixture.js";
import { formatFixtureCard } from "../helpers/fixtureFormatter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

const TZ = "Africa/Nairobi";
const VALID_TIPS = new Set(["1", "2", "X", "1X", "X2"]);
const ALLOWED = new Set(["1", "1X"]);
const FINISHED = ["FT", "AET", "PEN"];

function tipForDoc(doc) {
  const custom = doc.customPrediction?.trim?.();
  if (custom && VALID_TIPS.has(custom)) return custom;
  const tip = formatFixtureCard(doc).prediction;
  if (tip && VALID_TIPS.has(tip)) return tip;
  return null;
}

function pickResult(home, away) {
  if (home == null || away == null) return null;
  if (home > away) return "1";
  if (home < away) return "2";
  return "X";
}

function isTipCorrect(tip, result) {
  if (!tip || !result) return null;
  if (tip === "1") return result === "1";
  if (tip === "1X") return result === "1" || result === "X";
  if (tip === "2") return result === "2";
  if (tip === "X") return result === "X";
  if (tip === "X2") return result === "X" || result === "2";
  return null;
}

function pct(wins, total) {
  if (!total) return "0.00";
  return ((wins / total) * 100).toFixed(2);
}

/** Kenya YMD for `now` minus `dayOffset` (approx calendar day; OK for week window). */
function kenyaYmdAndWeekday(dayOffset) {
  const d = new Date(Date.now() - dayOffset * 86400000);
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  const wk = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
  }).format(d);
  return { ymd, wk };
}

function mondayThroughTodayRange() {
  const row = [];
  for (let i = 0; i < 7; i++) row.push({ i, ...kenyaYmdAndWeekday(i) });
  const monIdx = row.findIndex((r) => r.wk === "Mon");
  if (monIdx === -1) {
    throw new Error("Could not find Monday in 7-day lookback");
  }
  const slice = row.slice(0, monIdx + 1);
  const mondayYmd = slice[slice.length - 1].ymd;
  const todayYmd = slice[0].ymd;
  return { mondayYmd, todayYmd, dayCount: slice.length };
}

async function main() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error("MONGO_URI not set");
    process.exit(1);
  }

  const { mondayYmd, todayYmd, dayCount } = mondayThroughTodayRange();
  const start = new Date(`${mondayYmd}T00:00:00+03:00`);
  const end = new Date(`${todayYmd}T23:59:59.999+03:00`);

  await mongoose.connect(MONGO_URI);

  const docs = await Fixture.find({
    "fixture.fixture.date": { $gte: start.toISOString(), $lte: end.toISOString() },
    "fixture.fixture.status.short": { $in: FINISHED },
  }).lean();

  let wins = 0;
  let total = 0;
  const byTip = { 1: { wins: 0, total: 0 }, "1X": { wins: 0, total: 0 } };

  for (const doc of docs) {
    const tip = tipForDoc(doc);
    if (!tip || !ALLOWED.has(tip)) continue;

    const g = doc.fixture?.goals;
    const result = pickResult(g?.home, g?.away);
    const correct = isTipCorrect(tip, result);
    if (correct === null) continue;

    total += 1;
    if (correct) wins += 1;
    byTip[tip].total += 1;
    if (correct) byTip[tip].wins += 1;
  }

  console.log(`Kenya week window: ${mondayYmd} → ${todayYmd} (${dayCount} calendar day(s))`);
  console.log(`Finished fixtures in range: ${docs.length}`);
  console.log(`Scored tips (1 + 1X only): ${total}`);
  console.log(`Wins: ${wins}`);
  console.log(`Win rate: ${pct(wins, total)}%`);
  console.log(
    `  Tip 1: ${byTip["1"].wins}/${byTip["1"].total} (${pct(byTip["1"].wins, byTip["1"].total)}%)`
  );
  console.log(
    `  Tip 1X: ${byTip["1X"].wins}/${byTip["1X"].total} (${pct(byTip["1X"].wins, byTip["1X"].total)}%)`
  );

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
