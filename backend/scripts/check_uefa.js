import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Fixture from "../models/Fixture.js";
import League from "../models/League.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        const uefa = await League.findOne({ "league.id": 32 });
        console.log("---- LEAGUE 32 (UEFA WC Quali) ----");
        if (uefa) {
            console.log("Status: Found in database");
            console.log(`Active: ${uefa.active}, Odds: ${uefa.odds}, Predictions: ${uefa.predictions}`);
            console.log("Seasons:", uefa.seasons.find(s => s.current)?.year);

            // Look for fixtures
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const ymd = tomorrow.toISOString().split("T")[0];

            const fixtures = await Fixture.find({ "league.id": 32 });
            console.log(`\nTotal UEFA Qualification fixtures in DB: ${fixtures.length}`);

            const tommorowFixtures = await Fixture.find({
                "league.id": 32,
                "fixture.date": { $regex: ymd }
            });
            console.log(`Tomorrow's (${ymd}) UEFA fixtures in DB: ${tommorowFixtures.length}`);
            if (tommorowFixtures.length > 0) {
                console.log("Example:", tommorowFixtures[0].teams.home.name, "vs", tommorowFixtures[0].teams.away.name);
            }
        } else {
            console.log("Status: NOT FOUND in database!");
        }
    } catch (e) {
        console.error(e.message);
    } finally {
        mongoose.disconnect();
    }
}
run();
