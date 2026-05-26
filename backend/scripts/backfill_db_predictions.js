import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Fixture from "../models/Fixture.js";
import { applyMongoDnsHints, getMongoClientOptions } from "../mongoConnectOptions.js";
import { generateCustomBinaryPrediction } from "../helpers/dbPredictionEngine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local"), override: true });

async function runBackfill() {
    try {
        const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        // We only care about today and future fixtures
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const fixtures = await Fixture.find({
            "fixture.fixture.date": { $gte: today.toISOString() },
            dbPrediction: { $exists: false } // Only backfill those missing it
        });

        console.log(`Found ${fixtures.length} upcoming/recent fixtures missing dbPrediction.`);

        let updated = 0;
        for (const f of fixtures) {
            const matchData = f.fixture;
            const fixDate = matchData.fixture.date;
            const homeId = matchData.teams.home.id;
            const awayId = matchData.teams.away.id;

            try {
                const homeMatches = await Fixture.find({
                    $or: [ { "fixture.teams.home.id": homeId }, { "fixture.teams.away.id": homeId } ],
                    "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] },
                    "fixture.fixture.date": { $lt: fixDate }
                }).sort({ "fixture.fixture.date": -1 }).limit(10).lean();

                const awayMatches = await Fixture.find({
                    $or: [ { "fixture.teams.home.id": awayId }, { "fixture.teams.away.id": awayId } ],
                    "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] },
                    "fixture.fixture.date": { $lt: fixDate }
                }).sort({ "fixture.fixture.date": -1 }).limit(10).lean();

                const dbPrediction = generateCustomBinaryPrediction(homeMatches, awayMatches);

                await Fixture.updateOne(
                    { _id: f._id },
                    { $set: { dbPrediction } }
                );

                updated++;
                if (updated % 50 === 0) console.log(`Processed ${updated} / ${fixtures.length}...`);
            } catch (err) {
                console.error(`Error processing fixture ${f._id}:`, err);
            }
        }

        console.log(`Successfully updated ${updated} fixtures with new binary predictions!`);
    } catch (err) {
        console.error("Backfill failed:", err);
    } finally {
        mongoose.disconnect();
        process.exit(0);
    }
}

runBackfill();
