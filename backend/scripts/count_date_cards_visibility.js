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
  const offset = Number(process.env.OFFSET_DAYS || "3");
  const date = process.env.DATE || getDatePlus(offset);
  const start = new Date(`${date}T00:00:00.000Z`).toISOString();
  const end = new Date(`${date}T23:59:59.999Z`).toISOString();

  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters");

  const docs = await Fixture.find({
    "fixture.fixture.date": { $gte: start, $lte: end },
  }).lean();

  const cards = docs.map((d) => formatFixtureCard(d));
  const withAny1x2Odds = cards.filter((c) => {
    const o = c.odds;
    if (!o) return false;
    return Boolean(o.home || o.draw || o.away);
  });

  const statuses = {};
  for (const d of docs) {
    const s = d?.fixture?.fixture?.status?.short || "UNK";
    statuses[s] = (statuses[s] || 0) + 1;
  }

  console.log(`DATE=${date}`);
  console.log(`TOTAL_FIXTURES=${docs.length}`);
  console.log(`VISIBLE_WITH_CURRENT_FRONTEND_ODDS_FILTER=${withAny1x2Odds.length}`);
  console.log(`HIDDEN_BY_CURRENT_ODDS_FILTER=${docs.length - withAny1x2Odds.length}`);
  console.log("STATUSES=" + JSON.stringify(statuses, null, 2));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

