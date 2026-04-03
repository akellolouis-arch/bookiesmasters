import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Fixture from "../models/Fixture.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local"), override: true });

const day = process.argv[2] || "2026-04-03";
const start = new Date(`${day}T00:00:00+03:00`).toISOString();
const end = new Date(`${day}T23:59:59.999+03:00`).toISOString();

await mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 30000,
  autoSelectFamily: false,
});

const doc = await Fixture.findOne({
  "fixture.fixture.date": { $gte: start, $lte: end },
  odds: { $exists: true, $ne: [] },
}).lean();

if (!doc) {
  console.log("no fixture with odds for day", day);
  process.exit(0);
}

const bm = doc.odds[0];
const mw = bm?.markets?.find((m) => m.name === "Match Winner" || m.id === 1);
console.log("bookmaker", bm?.name);
console.log("matchWinner", mw?.name, "id", mw?.id);
console.log("values", JSON.stringify(mw?.values, null, 2));

await mongoose.disconnect();
