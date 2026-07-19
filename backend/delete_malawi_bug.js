import mongoose from "mongoose";
import dotenv from "dotenv";
import Fixture from "./models/Fixture.js";


dotenv.config({ path: ".env.local" });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  // Let's find ANY fixture where status is 'FT' but date is in the future relative to the start of today,
  // or just search by Malawi and FT.
  
  const targetId = 1538637;
  const result = await Fixture.deleteOne({ fixtureId: targetId });
  console.log(`Deleted fixture ${targetId}:`, result);

  process.exit(0);
}
run();
