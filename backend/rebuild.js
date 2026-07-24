import mongoose from "mongoose";
import dotenv from "dotenv";
import { getPredictedFixturesGroupedByLeague } from "./services/fixtureCardService.js";

dotenv.config({ path: "../.env.local" });

const dates = [
  "2026-07-23", // Today
  "2026-07-24", // Tomorrow
  "2026-07-25", // Next day
  "2026-07-26", // Next day
  "2026-07-22"  // Yesterday
];

mongoose.connect(process.env.MONGO_URI).then(async () => { 
  console.log("Connected to DB, recalculating predictions...");
  for (const date of dates) {
    console.log(`Calculating for ${date}...`);
    try {
      await getPredictedFixturesGroupedByLeague(date);
      console.log(`Finished ${date}`);
    } catch(e) {
      console.error(`Error on ${date}:`, e);
    }
  }
  process.exit(0); 
}).catch(console.error);
