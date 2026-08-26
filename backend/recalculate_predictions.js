import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Fixture from "./models/Fixture.js";
import { getPredictedFixturesGroupedByLeague, clearPredictionCache } from "./services/fixtureCardService.js";
import { getMongoClientOptions } from "./mongoConnectOptions.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local"), override: true });

const MONGO_CONNECT_OPTIONS = getMongoClientOptions();
const KENYA_TZ = "Africa/Nairobi";
const kenyaYmdFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: KENYA_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function getKenyaDatePlus(offsetDays) {
  const todayYmd = kenyaYmdFormatter.format(new Date());
  const [y, m, d] = todayYmd.split("-").map(Number);
  const base = new Date(
    `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T00:00:00+03:00`
  );
  const target = new Date(base.getTime() + offsetDays * 86400000);
  return kenyaYmdFormatter.format(target);
}

async function run() {
    try {
        const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";
        await mongoose.connect(MONGO_URI, MONGO_CONNECT_OPTIONS);
        console.log("🔌 Connected to DB.");

        // Loop from -2 (2 days ago) to 7 (7 days ahead)
        for (let offset = -2; offset <= 7; offset++) {
            const dateStr = getKenyaDatePlus(offset);
            console.log(`\n📅 --- Processing Date: ${dateStr} ---`);
            clearPredictionCache();
            
            // 1. Clear existing predictions for this date range
            const startOfDay = new Date(`${dateStr}T00:00:00+03:00`);
            const endOfDay = new Date(`${dateStr}T23:59:59.999+03:00`);
            
            const clearResult = await Fixture.updateMany(
                {
                    "fixture.fixture.date": {
                        $gte: startOfDay.toISOString(),
                        $lte: endOfDay.toISOString()
                    }
                },
                { $unset: { predictionTip: 1 } }
            );
            console.log(`🧹 Cleared existing predictionTip for ${clearResult.modifiedCount} fixtures.`);
            
            // 2. Run the prediction calculator (this will recalculate and save)
            console.log(`🧠 Calculating new predictions...`);
            await getPredictedFixturesGroupedByLeague(dateStr);
            console.log(`✅ Finished calculating for ${dateStr}.`);
        }
        
        console.log("\n🎉 All requested days recalculated successfully!");
        process.exit(0);
    } catch (e) {
        console.error("❌ Error running script:", e);
        process.exit(1);
    }
}

run();
