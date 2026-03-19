import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import Fixture from "../models/Fixture.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function main() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI missing in backend/.env");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const count = await Fixture.countDocuments({});
  console.log(`FIXTURES_COUNT=${count}`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

