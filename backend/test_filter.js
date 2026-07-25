import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Fixture from "./models/Fixture.js";
import { getMongoClientOptions } from "./mongoConnectOptions.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.local"), override: true });

async function run() {
    await mongoose.connect(process.env.MONGO_URI, getMongoClientOptions());
    
    const date = '2026-07-25';
    const startOfDayKenya = new Date(`${date}T00:00:00+03:00`);
    const endOfDayKenya = new Date(`${date}T23:59:59.999+03:00`);
    const matchFilter = {
        'fixture.fixture.date': {
          $gte: startOfDayKenya.toISOString(),
          $lte: endOfDayKenya.toISOString()
        }
    };
    
    const fixtures = await Fixture.aggregate([{ $match: matchFilter }]);
    
  const validFixtures = fixtures.filter((f) => {
    if (f.fixture?.league?.name?.toLowerCase().includes("friendlies")) {
      return false;
    }
    // Drop NS matches that are 30+ mins past scheduled kickoff
    if (f.fixture?.fixture?.status?.short === "NS" && f.fixture?.fixture?.date) {
      const kickoff = new Date(f.fixture.fixture.date).getTime();
      const now = new Date().getTime();
      const diffMins = (now - kickoff) / (1000 * 60);
      if (diffMins > 30) {
        return false;
      }
    }
    return true;
  });
  
  console.log("validFixtures length:", validFixtures.length);
  process.exit(0);
}

run();
