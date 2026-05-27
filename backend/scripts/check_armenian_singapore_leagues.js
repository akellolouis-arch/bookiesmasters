import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import League from "../models/League.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local"), override: true });

async function checkLeagues() {
  try {
    const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";
    await mongoose.connect(MONGO_URI);
    
    // Using regular expressions to do a case-insensitive search
    const armenianLeagues = await League.find({ "league.country": { $regex: /Armenia/i } });
    const singaporeLeagues = await League.find({ "league.country": { $regex: /Singapore/i } });
    
    console.log("Armenian Leagues:", JSON.stringify(armenianLeagues.map(l => ({ name: l.league.name, country: l.league.country, id: l.league.id })), null, 2));
    console.log("Singapore Leagues:", JSON.stringify(singaporeLeagues.map(l => ({ name: l.league.name, country: l.league.country, id: l.league.id })), null, 2));

  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

checkLeagues();
