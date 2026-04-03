/**
 * One-off: count fixtures for a Kenya calendar day with prediction / odds.
 * Usage: node scripts/verify_predictions_odds_day.js [YYYY-MM-DD]
 * Default: 2026-04-03
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Fixture from "../models/Fixture.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local"), override: true });

const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 45_000,
  autoSelectFamily: false,
  retryWrites: true,
};

function dayWindowKenya(ymd) {
  const start = new Date(`${ymd}T00:00:00+03:00`);
  const end = new Date(`${ymd}T23:59:59.999+03:00`);
  return {
    "fixture.fixture.date": { $gte: start.toISOString(), $lte: end.toISOString() },
  };
}

async function statsForDay(ymd) {
  const q = dayWindowKenya(ymd);
  const total = await Fixture.countDocuments(q);
  const withOdds = await Fixture.countDocuments({
    ...q,
    odds: { $exists: true, $type: "array", $not: { $size: 0 } },
  });
  const withPred = await Fixture.countDocuments({
    ...q,
    $expr: {
      $gt: [
        { $size: { $objectToArray: { $ifNull: ["$prediction", {}] } } },
        0,
      ],
    },
  });
  const nsQ = { ...q, "fixture.fixture.status.short": "NS" };
  const nsTotal = await Fixture.countDocuments(nsQ);
  const nsWithOdds = await Fixture.countDocuments({
    ...nsQ,
    odds: { $exists: true, $type: "array", $not: { $size: 0 } },
  });
  return { ymd, total, withOdds, withPred, nsTotal, nsWithOdds };
}

async function main() {
  const days = process.argv.slice(2).length
    ? process.argv.slice(2)
    : ["2026-04-03", "2026-04-04"];

  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI missing");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, MONGO_OPTIONS);

  for (const d of days) {
    const s = await statsForDay(d);
    console.log(JSON.stringify(s, null, 2));
  }

  const sample = await Fixture.findOne({
    ...dayWindowKenya(days[0]),
    odds: { $exists: true, $type: "array", $not: { $size: 0 } },
  })
    .select({ fixtureId: 1, prediction: 1, odds: 1, "fixture.fixture.status": 1 })
    .lean();

  console.log(
    "\nSample fixture with non-empty odds (first day):",
    sample
      ? {
          fixtureId: sample.fixtureId,
          statusShort: sample.fixture?.fixture?.status?.short,
          oddsBookmakers: Array.isArray(sample.odds) ? sample.odds.length : 0,
          predictionKeys:
            sample.prediction && typeof sample.prediction === "object"
              ? Object.keys(sample.prediction)
              : [],
        }
      : null
  );

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
