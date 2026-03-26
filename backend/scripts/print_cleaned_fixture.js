import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const Fixture = (await import("../models/Fixture.js")).default;

async function printCleanedFixture() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected\n");

    const doc = await Fixture.findOne(
      { cleanupDone: true },
      { __v: 0 }
    ).lean();

    if (!doc) {
      console.log("No cleaned fixture found (cleanupDone: true). Run daily update first on fixtures > 7 days old.");
      process.exit(0);
    }

    console.log("--- ONE FIXTURE DOCUMENT AFTER CLEANUP ---\n");
    console.log(JSON.stringify(doc, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

printCleanedFixture();
