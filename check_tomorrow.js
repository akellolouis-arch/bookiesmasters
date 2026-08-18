import mongoose from "mongoose";
import dotenv from "dotenv";
import Fixture from "./backend/models/Fixture.js";

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const tomorrowStr = "2026-08-13";
  const startOfDayKenya = new Date(`${tomorrowStr}T00:00:00+03:00`);
  const endOfDayKenya = new Date(`${tomorrowStr}T23:59:59.999+03:00`);

  const count = await Fixture.countDocuments({
    "fixture.fixture.date": {
      $gte: startOfDayKenya.toISOString(),
      $lte: endOfDayKenya.toISOString()
    }
  });

  console.log(`Fixtures for ${tomorrowStr}:`, count);

  const sample = await Fixture.findOne({
    "fixture.fixture.date": {
      $gte: startOfDayKenya.toISOString(),
      $lte: endOfDayKenya.toISOString()
    }
  }).select("fixture.fixture.date predictionTip");

  console.log("Sample:", sample);

  process.exit();
}

check();
