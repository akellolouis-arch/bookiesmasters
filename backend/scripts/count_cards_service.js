/**
 * Same DB + same grouping as API /api/fixtures/cards (no HTTP).
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { getFixturesGroupedByLeague } from "../services/fixtureCardService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local"), override: true });

const date = process.argv[2] || "2026-03-31";

await mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 45_000,
  autoSelectFamily: false,
  retryWrites: true,
});

const groups = await getFixturesGroupedByLeague(date);
let matchCount = 0;
for (const g of groups) matchCount += g.matches?.length ?? 0;
console.log(
  JSON.stringify({ date, leagues: groups.length, matches: matchCount }, null, 2)
);
if (groups[0]?.matches?.[0]) {
  const m = groups[0].matches[0];
  console.log("first match odds:", m.odds);
}

await mongoose.disconnect();
