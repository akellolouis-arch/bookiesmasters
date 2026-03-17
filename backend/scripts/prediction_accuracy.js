/**
 * Compare API-Football predictions (1, 2, 1X, X2) with actual results for finished fixtures.
 * Usage: node backend/scripts/prediction_accuracy.js [date1] [date2]
 *   Dates in YYYY-MM-DD (Kenya day). If omitted: yesterday and last Sunday.
 * Requires: MONGO_URI in .env.local
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Fixture from "../models/Fixture.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const TIMEZONE = "Africa/Nairobi";

function getDateString(d) {
  return d.toLocaleDateString("en-CA", { timeZone: TIMEZONE });
}

/** Yesterday and last Sunday in Kenya time */
function getDefaultDates() {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastSunday = new Date(now);
  const day = lastSunday.getDay();
  const diff = day === 0 ? 7 : day;
  lastSunday.setDate(lastSunday.getDate() - diff);
  return [getDateString(yesterday), getDateString(lastSunday)];
}

/**
 * Derive displayed tip (1, 2, 1X, X2) from stored prediction - legacy API-Football logic only.
 */
function getTipFromPrediction(pred, homeName) {
  if (!pred || typeof pred !== "object") return null;
  if (typeof pred === "string") return pred;
  const { win_or_draw, winner } = pred;
  if (win_or_draw === true) {
    return winner && winner.name === homeName ? "1X" : "X2";
  }
  return winner && winner.name === homeName ? "1" : "2";
}

/**
 * WIN | LOSS | PENDING from tip vs score.
 */
function getTipStatus(tip, homeGoals, awayGoals) {
  if (tip === "1") return homeGoals > awayGoals ? "WIN" : "LOSS";
  if (tip === "2") return awayGoals > homeGoals ? "WIN" : "LOSS";
  if (tip === "X") return homeGoals === awayGoals ? "WIN" : "LOSS";
  if (tip === "1X") return homeGoals >= awayGoals ? "WIN" : "LOSS";
  if (tip === "X2") return awayGoals >= homeGoals ? "WIN" : "LOSS";
  return "PENDING";
}

async function getWinRateForDate(dateStr) {
  const startOfDay = new Date(`${dateStr}T00:00:00+03:00`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999+03:00`);

  const fixtures = await Fixture.find({
    "fixture.fixture.date": { $gte: startOfDay.toISOString(), $lte: endOfDay.toISOString() },
    "fixture.fixture.status.short": "FT",
  })
    .lean()
    .select("fixtureId fixture.prediction customPrediction fixture.teams fixture.goals fixture.fixture");

  const results = [];
  let wins = 0;
  let total = 0;

  for (const doc of fixtures) {
    const fx = doc.fixture;
    const goals = fx?.goals || fx?.score;
    const homeGoals = goals?.home;
    const awayGoals = goals?.away;
    if (homeGoals == null || awayGoals == null) continue;

    const tip = doc.customPrediction || getTipFromPrediction(doc.prediction || fx?.prediction, fx?.teams?.home?.name);
    if (!tip || !["1", "2", "X", "1X", "X2"].includes(tip)) continue;

    const status = getTipStatus(tip, homeGoals, awayGoals);
    if (status === "PENDING") continue;

    total += 1;
    if (status === "WIN") wins += 1;
    results.push({
      fixtureId: doc.fixtureId,
      match: `${fx?.teams?.home?.name || "?"} vs ${fx?.teams?.away?.name || "?"}`,
      tip,
      score: `${homeGoals}-${awayGoals}`,
      status,
    });
  }

  return {
    date: dateStr,
    total,
    wins,
    winRate: total ? (wins / total * 100).toFixed(1) : null,
    results,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dates = args.length >= 2 ? [args[0], args[1]] : getDefaultDates();

  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI not set. Use .env.local or .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB\n");

  for (const dateStr of dates) {
    const summary = await getWinRateForDate(dateStr);
    console.log(`--- ${summary.date} ---`);
    console.log(`Tips (1/2/1X/X2) with result: ${summary.total}`);
    console.log(`Wins: ${summary.wins}`);
    console.log(`Win rate: ${summary.winRate ?? "N/A"}%`);
    if (summary.results.length > 0 && summary.results.length <= 30) {
      summary.results.forEach((r) => console.log(`  ${r.match} | Tip: ${r.tip} | ${r.score} | ${r.status}`));
    } else if (summary.results.length > 30) {
      summary.results.slice(0, 15).forEach((r) => console.log(`  ${r.match} | Tip: ${r.tip} | ${r.score} | ${r.status}`));
      console.log(`  ... and ${summary.results.length - 15} more`);
    }
    console.log("");
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
