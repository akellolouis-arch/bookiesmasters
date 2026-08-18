import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { getPredictedFixturesGroupedByLeague } from "./services/fixtureCardService.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected");
  
  try {
    const res = await getPredictedFixturesGroupedByLeague("2026-08-17");
    console.log("Success! Groups:", res.length);
  } catch (err) {
    console.error("Caught error:", err);
  }
  
  process.exit(0);
}

run().catch(console.error);
