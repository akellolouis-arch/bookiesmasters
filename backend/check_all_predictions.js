import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.local'), override: true });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Fixture = mongoose.model('Fixture', new mongoose.Schema({}, { strict: false }));

  const days = ["2026-07-25", "2026-07-26", "2026-07-27", "2026-07-28", "2026-07-29", "2026-07-30", "2026-07-31"];
  
  for (const day of days) {
    const start = new Date(`${day}T00:00:00+03:00`).toISOString();
    const end = new Date(`${day}T23:59:59.999+03:00`).toISOString();

    const predicted = await Fixture.find({
      'fixture.fixture.date': { $gte: start, $lte: end },
      predictionTip: { $nin: [null, "NONE", "N/A", "none"] }
    }).lean();

    const counts = {};
    for (const p of predicted) {
      counts[p.predictionTip] = (counts[p.predictionTip] || 0) + 1;
    }

    console.log(`\n📅 Date: ${day}`);
    console.log(`Total Predicted: ${predicted.length}`);
    if (predicted.length > 0) {
      console.log(`Breakdown:`, counts);
    }
  }

  process.exit(0);
}

run();
