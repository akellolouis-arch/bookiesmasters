/**
 * Check if Europa League (3) and Conference League (848) exist in leagues collection.
 * Usage: node scripts/check_saved_uefa_leagues.js
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import League from "../models/League.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local"), override: true });

const TARGET_IDS = [
  { id: 3, label: "UEFA Europa League" },
  { id: 848, label: "UEFA Europa Conference League" },
];

async function main() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI missing");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 45_000,
    autoSelectFamily: false,
    retryWrites: true,
  });

  const totalLeagues = await League.countDocuments({});
  console.log("Total documents in `leagues` collection:", totalLeagues, "\n");

  for (const { id, label } of TARGET_IDS) {
    const doc = await League.findOne({ "league.id": id }).lean();
    if (!doc) {
      console.log(`${label} (league.id=${id}): NOT SAVED`);
      continue;
    }
    console.log(`${label} (league.id=${id}): SAVED`);
    console.log(
      JSON.stringify(
        {
          name: doc.league?.name,
          country: doc.country?.name,
          season: doc.season,
          active: doc.active,
          odds: doc.odds,
          predictions: doc.predictions,
        },
        null,
        2
      )
    );
    console.log("");
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
