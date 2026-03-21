/**
 * Top 10 saved leagues by number of fixture documents in MongoDB.
 * Run: node scripts/rank_saved_leagues.js
 */
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";
import League from "../models/League.js";
import Fixture from "../models/Fixture.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";

async function main() {
  await mongoose.connect(MONGO_URI);
  const saved = await League.find({}).lean();
  const ids = [...new Set(saved.map((l) => l.league?.id).filter((id) => id != null))];

  if (ids.length === 0) {
    console.log("No leagues in DB.");
    process.exit(0);
  }

  const counts = await Fixture.aggregate([
    { $match: { "fixture.league.id": { $in: ids } } },
    { $group: { _id: "$fixture.league.id", fixtures: { $sum: 1 } } },
    { $sort: { fixtures: -1 } },
    { $limit: 10 },
  ]);

  const byId = new Map(saved.map((l) => [l.league.id, l]));

  console.log("\nTop 10 saved leagues by fixture rows in MongoDB:\n");
  counts.forEach((row, i) => {
    const doc = byId.get(row._id);
    const name = doc?.league?.name ?? "?";
    const country = doc?.country?.name ?? doc?.league?.country ?? "?";
    console.log(`${i + 1}. ${name} (${country}) — id ${row._id} — ${row.fixtures} fixtures`);
  });

  if (counts.length < 10) {
    console.log(`\n(Only ${counts.length} leagues had fixture data; saved total: ${ids.length})`);
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
