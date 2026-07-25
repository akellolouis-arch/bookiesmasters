import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Fixture from "./models/Fixture.js";
import { getMongoClientOptions } from "./mongoConnectOptions.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.local"), override: true });

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
    await mongoose.connect(process.env.MONGO_URI, getMongoClientOptions());
    
    for (let offset = -5; offset <= 1; offset++) {
        const dateStr = getKenyaDatePlus(offset);
        const startOfDayKenya = new Date(`${dateStr}T00:00:00+03:00`);
        const endOfDayKenya = new Date(`${dateStr}T23:59:59.999+03:00`);
        
        const fixtures = await Fixture.find({
            'fixture.fixture.date': {
              $gte: startOfDayKenya.toISOString(),
              $lte: endOfDayKenya.toISOString()
            }
        });
        
        const counts = {};
        fixtures.forEach(f => {
            const tip = f.predictionTip;
            counts[tip] = (counts[tip] || 0) + 1;
        });
        console.log(`Counts for ${dateStr} (Total: ${fixtures.length}):`, counts);
    }
    process.exit(0);
}

run();
