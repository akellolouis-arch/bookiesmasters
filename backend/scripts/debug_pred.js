import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Fixture from "../models/Fixture.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const f = await Fixture.findOne({ prediction: { $ne: null } });
  console.log(JSON.stringify(f.prediction, null, 2));
  process.exit(0);
}
check();
