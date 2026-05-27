import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Fixture from "../models/Fixture.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local"), override: true });

async function removeEvents() {
  try {
    const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB. Starting database scrub for 'events'...");

    // Update all documents to remove 'fixture.events' and 'events' (if any snuck in at the root level)
    const result = await Fixture.updateMany(
      {},
      { 
        $unset: { 
          "fixture.events": "",
          "events": "" 
        } 
      }
    );

    console.log(`✅ Scrub complete! Modified ${result.modifiedCount} documents (out of ${result.matchedCount} matched).`);
  } catch (error) {
    console.error("❌ Error scrubbing events:", error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

removeEvents();
