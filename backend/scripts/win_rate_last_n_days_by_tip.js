/**
 * Win rate by prediction tip (1, 2, X, 1X, X2) for the last N calendar days (Africa/Nairobi).
 * Uses the same tip source as cards: customPrediction when set to a valid 1X2 tip, else API prediction via formatFixtureCard.
 *
 * Usage (from repo root):
 *   node backend/scripts/win_rate_last_n_days_by_tip.js
 *   DAYS=5 node backend/scripts/win_rate_last_n_days_by_tip.js
 *
 * Requires MONGO_URI in backend/.env or .env.local (repo root).
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
const FINISHED = ["FT", "AET", "PEN"];

function kenyaDateStringsLastNDays(n) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const out = [];
  const now = new Date();
  for (let i = 1; i <= n; i++) {
    const d = new Date(now.getTime() - i * 86400000);
    out.push(formatter.format(d));
  }
  return out;
}

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
  if (tip === "2") return result === "2";
  if (tip === "X") return result === "X";
  if (tip === "1X") return result === "1" || result === "X";
  if (tip === "X2") return result === "X" || result === "2";
  return null;
}

function pct(wins, total) {
  if (!total) return "0.00";
  return ((wins / total) * 100).toFixed(2);
}

async function scoreKenyaDate(dateStr) {
  const start = new Date(`${dateStr}T00:00:00+03:00`);
  const end = new Date(`${dateStr}T23:59:59.999+03:00`);

  const docs = await Fixture.find({
    "fixture.fixture.date": { $gte: start.toISOString(), $lte: end.toISOString() },
    "fixture.fixture.status.short": { $in: FINISHED },
  }).lean();

  const byTip = {};
  let wins = 0;
  let scorable = 0;

  for (const doc of docs) {
    const tip = tipForDoc(doc);
    if (!tip) continue;

    const g = doc.fixture?.goals;
    const result = pickResult(g?.home, g?.away);
    const correct = isTipCorrect(tip, result);
    if (correct === null) continue;

    scorable += 1;
    if (correct) wins += 1;

    if (!byTip[tip]) byTip[tip] = { wins: 0, total: 0 };
    byTip[tip].total += 1;
    if (correct) byTip[tip].wins += 1;
  }

  return {
    dateStr,
    totalFinished: docs.length,
    scorable,
    wins,
    winRatePct: pct(wins, scorable),
    byTip,
  };
}

function printByTip(byTip, label) {
  const entries = Object.entries(byTip).sort((a, b) => a[0].localeCompare(b[0]));
  console.log(label);
  for (const [tip, v] of entries) {
    console.log(
      `  ${tip}: ${v.wins}/${v.total} (${pct(v.wins, v.total)}%)`
    );
  }
  if (entries.length === 0) console.log("  (no scorable tips)");
}

async function main() {
  const days = Math.min(30, Math.max(1, Number(process.env.DAYS || "2")));
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error("MONGO_URI not set (backend/.env or .env.local)");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  const dateList = kenyaDateStringsLastNDays(days);
  const perDay = [];
  for (const d of dateList) {
    // eslint-disable-next-line no-await-in-loop
    perDay.push(await scoreKenyaDate(d));
  }

  const combined = {};
  let totalWins = 0;
  let totalScorable = 0;

  console.log(`Kenya calendar — last ${days} day(s) (excluding today)\n`);

  for (const row of perDay) {
    console.log(`=== ${row.dateStr} ===`);
    console.log(
      `Finished fixtures: ${row.totalFinished} | Tips scored: ${row.scorable} | Wins: ${row.wins} | Win rate: ${row.winRatePct}%`
    );
    printByTip(row.byTip, "By tip:");
    console.log("");
    totalWins += row.wins;
    totalScorable += row.scorable;
    for (const [tip, v] of Object.entries(row.byTip)) {
      if (!combined[tip]) combined[tip] = { wins: 0, total: 0 };
      combined[tip].wins += v.wins;
      combined[tip].total += v.total;
    }
  }

  console.log(`=== COMBINED (last ${days} days) ===`);
  console.log(
    `Wins: ${totalWins}/${totalScorable} (${pct(totalWins, totalScorable)}%)`
  );
  printByTip(combined, "By tip (combined):");

  const sorted = Object.entries(combined)
    .map(([tip, v]) => ({
      tip,
      wins: v.wins,
      total: v.total,
      rate: v.total ? v.wins / v.total : 0,
    }))
    .sort((a, b) => a.rate - b.rate);

  if (sorted.length) {
    console.log("\nLowest win-rate tips first (candidates to filter):");
    for (const s of sorted) {
      console.log(
        `  ${s.tip}: ${pct(s.wins, s.total)}% (${s.wins}/${s.total})`
      );
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
