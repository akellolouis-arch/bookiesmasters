import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "./backend/.env" });
if (!process.env.MONGO_URI) {
  dotenv.config({ path: "./.env" });
}

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const db = mongoose.connection.db;
  
  const vipCount = await db.collection("vipfixtures").countDocuments();
  console.log("vipfixtures count:", vipCount);

  const premiumTipsCount = await db.collection("premiumtips").countDocuments();
  console.log("premiumtips count:", premiumTipsCount);

  if (premiumTipsCount > 0) {
      const tip = await db.collection("premiumtips").findOne({});
      console.log("Sample premiumtip:", tip);
  }

  process.exit();
}

check();
