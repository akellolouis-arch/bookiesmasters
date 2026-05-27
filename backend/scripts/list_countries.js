import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import League from "../models/League.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local"), override: true });

async function listCountries() {
  try {
    const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";
    await mongoose.connect(MONGO_URI);
    
    const leagues = await League.find({}, { "country.name": 1, "league.name": 1, "league.id": 1 });
    const countries = new Set();
    leagues.forEach(l => countries.add(l.country?.name));
    
    console.log(Array.from(countries).sort());
    
    const kenyaLeagues = leagues.filter(l => l.country?.name === "Kenya");
    console.log("Kenya leagues:", kenyaLeagues);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

listCountries();
