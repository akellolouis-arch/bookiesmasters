import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { getFixturesGroupedByLeague } from "../services/fixtureCardService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local"), override: true });

async function testService() {
  try {
    const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    const result = await getFixturesGroupedByLeague("2026-05-28");
    console.log(`Success! Returned ${result.length} leagues.`);
  } catch (error) {
    console.error("Error executing service:", error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

testService();
