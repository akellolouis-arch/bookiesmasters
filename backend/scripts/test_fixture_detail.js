import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { getFixtureById } from "../services/fixtureService.js";
import Fixture from "../models/Fixture.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local"), override: true });

async function testFixtureDetail() {
  try {
    const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";
    await mongoose.connect(MONGO_URI);
    
    // Find any fixture from today or tomorrow
    const doc = await Fixture.findOne().sort({ "fixture.fixture.date": -1 });
    if (!doc) {
      console.log("No fixtures found in DB.");
      return;
    }
    
    const id = doc.fixtureId;
    console.log(`Found Fixture ID: ${id}`);
    
    const details = await getFixtureById(id);
    if (!details) {
      console.log(`❌ getFixtureById returned null for ID ${id}`);
    } else {
      console.log(`✅ getFixtureById succeeded for ID ${id}`);
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

testFixtureDetail();
