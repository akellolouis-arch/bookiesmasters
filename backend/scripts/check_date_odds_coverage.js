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

async function main() {
  const date = process.env.DATE || getDatePlus(2);
  const start = new Date(`${date}T00:00:00.000Z`).toISOString();
  const end = new Date(`${date}T23:59:59.999Z`).toISOString();

  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters");

  const docs = await Fixture.find({
    "fixture.fixture.date": { $gte: start, $lte: end },
  }).lean();

  let withOdds = 0;
  let withoutOdds = 0;
  const missingByLeague = new Map();
  const presentByLeague = new Map();

  for (const d of docs) {
    const card = formatFixtureCard(d);
    const has = Boolean(card?.odds?.home || card?.odds?.draw || card?.odds?.away);
    const leagueId = d?.fixture?.league?.id ?? -1;
    const leagueName = d?.fixture?.league?.name ?? "Unknown";
    const key = `${leagueId}::${leagueName}`;

    if (has) {
      withOdds += 1;
      presentByLeague.set(key, (presentByLeague.get(key) || 0) + 1);
    } else {
      withoutOdds += 1;
      missingByLeague.set(key, (missingByLeague.get(key) || 0) + 1);
    }
  }

  const topMissing = [...missingByLeague.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([k, c]) => {
      const [id, name] = k.split("::");
      return { leagueId: Number(id), league: name, missing: c, withOdds: presentByLeague.get(k) || 0 };
    });

  console.log(`DATE=${date}`);
  console.log(`TOTAL_FIXTURES=${docs.length}`);
  console.log(`WITH_1X2_ODDS=${withOdds}`);
  console.log(`WITHOUT_1X2_ODDS=${withoutOdds}`);
  console.log(`ODDS_COVERAGE=${docs.length ? ((withOdds / docs.length) * 100).toFixed(2) : "0.00"}%`);
  console.log("TOP_MISSING_LEAGUES=" + JSON.stringify(topMissing, null, 2));

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

