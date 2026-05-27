import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local"), override: true });

async function checkH2H() {
  try {
    const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";
    await mongoose.connect(MONGO_URI);
    
    const Fixture = mongoose.models.Fixture || mongoose.model("Fixture", new mongoose.Schema({}, {strict: false}));
    
    const doc = await Fixture.findOne({ "h2h.0": { $exists: true } });
    if (doc) {
      console.log(JSON.stringify(doc.h2h[0].score, null, 2));
    } else {
      console.log("No H2H data found");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

checkH2H();
