import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Fixture from "../models/Fixture.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local"), override: true });

async function checkFixtures() {
  try {
    const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    const dates = ["2026-05-27", "2026-05-28"];
    for (const date of dates) {
      const startOfDayKenya = new Date(`${date}T00:00:00+03:00`);
      const endOfDayKenya = new Date(`${date}T23:59:59.999+03:00`);

      const count = await Fixture.countDocuments({
        "fixture.fixture.date": {
          $gte: startOfDayKenya.toISOString(),
          $lte: endOfDayKenya.toISOString()
        }
      });
      console.log(`Fixtures for ${date}: ${count}`);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

checkFixtures();
