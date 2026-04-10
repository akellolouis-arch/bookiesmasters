/**
 * Confirm fixtures + odds in Mongo for Kenya calendar today and tomorrow.
 * Usage: node scripts/confirm_kenya_today_tomorrow_mongo.js
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Fixture from "../models/Fixture.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local"), override: true });

const KENYA_TZ = "Africa/Nairobi";
const kenyaYmdFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: KENYA_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function getKenyaDatePlus(offsetDays) {
  const todayYmd = kenyaYmdFormatter.format(new Date());
  const [y, m, d] = todayYmd.split("-").map(Number);
  const base = new Date(
    `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T00:00:00+03:00`
  );
  const target = new Date(base.getTime() + offsetDays * 86400000);
  return kenyaYmdFormatter.format(target);
}

function dayWindow(ymd) {
  const start = new Date(`${ymd}T00:00:00+03:00`);
  const end = new Date(`${ymd}T23:59:59.999+03:00`);
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    match: {
      "fixture.fixture.date": {
        $gte: start.toISOString(),
        $lte: end.toISOString(),
      },
    },
  };
}

async function statsForDay(ymd) {
  const { match, startIso, endIso } = dayWindow(ymd);
  const total = await Fixture.countDocuments(match);
  const withOddsArr = await Fixture.countDocuments({
    ...match,
    odds: { $exists: true, $type: "array", $not: { $size: 0 } },
  });
  const withPred = await Fixture.countDocuments({
    ...match,
    $expr: {
      $gt: [
        { $size: { $objectToArray: { $ifNull: ["$prediction", {}] } } },
        0,
      ],
    },
  });
  const ns = await Fixture.countDocuments({
    ...match,
    "fixture.fixture.status.short": "NS",
  });
  const nsWithOddsArr = await Fixture.countDocuments({
    ...match,
    "fixture.fixture.status.short": "NS",
    odds: { $exists: true, $type: "array", $not: { $size: 0 } },
  });

  return {
    ymd: ymd,
    windowUtc: { from: startIso, to: endIso },
    total,
    withNonEmptyOddsArray: withOddsArr,
    withPrediction: withPred,
    statusNS: ns,
    statusNS_withNonEmptyOddsArray: nsWithOddsArr,
  };
}

async function main() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI missing");
    process.exit(1);
  }

  const today = getKenyaDatePlus(0);
  const tomorrow = getKenyaDatePlus(1);

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 45_000,
    autoSelectFamily: false,
    retryWrites: true,
  });

  console.log(
    "Kenya dates (now in Nairobi):",
    today,
    "(today),",
    tomorrow,
    "(tomorrow)\n"
  );

  const s0 = await statsForDay(today);
  const s1 = await statsForDay(tomorrow);

  console.log("TODAY", JSON.stringify(s0, null, 2));
  console.log("TOMORROW", JSON.stringify(s1, null, 2));

  const sampleTomorrow = await Fixture.findOne({
    ...dayWindow(tomorrow).match,
    "fixture.fixture.status.short": "NS",
  })
    .select({ fixtureId: 1, odds: 1, "fixture.teams": 1, "fixture.fixture.status": 1 })
    .lean();

  if (sampleTomorrow) {
    const o = sampleTomorrow.odds?.[0];
    const mw = o?.markets?.find(
      (m) => m.id === 1 || (m.name || "").toLowerCase() === "match winner"
    );
    console.log("\nSample NS fixture tomorrow:", {
      fixtureId: sampleTomorrow.fixtureId,
      teams: `${sampleTomorrow.fixture?.teams?.home?.name} vs ${sampleTomorrow.fixture?.teams?.away?.name}`,
      oddsBookmakers: Array.isArray(sampleTomorrow.odds)
        ? sampleTomorrow.odds.length
        : 0,
      matchWinnerValues: mw?.values?.length ?? 0,
    });
  } else {
    console.log("\nNo NS fixture found for tomorrow window (or no docs at all).");
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
