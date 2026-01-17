import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { getFixtureById } from "./services/fixtureService.js";
import Fixture from "./models/Fixture.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

async function run() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing in .env");
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to DB");

        // Find a fixture that has a venue city
        const fixture = await Fixture.findOne({
            "fixture.fixture.venue.city": { $exists: true, $ne: null }
        }).sort({ "fixture.fixture.date": -1 });

        if (!fixture) {
            console.log("❌ No fixture found with venue city.");
            return;
        }

        console.log(`\n🔎 Testing with Fixture ID: ${fixture.fixtureId}`);
        console.log(`   Match: ${fixture.fixture.teams.home.name} vs ${fixture.fixture.teams.away.name}`);
        console.log(`   Venue City: ${fixture.fixture.fixture.venue.city}`);
        console.log(`   Date: ${fixture.fixture.fixture.date}`);

        const result = await getFixtureById(fixture.fixtureId);

        console.log("\n--- RESULT CONDITIONS ---");
        console.log(JSON.stringify(result.conditions, null, 2));

        if (result.conditions?.weather) {
            console.log("✅ Weather fetched successfully.");
        } else {
            console.log("⚠️ Weather MISSING.");
        }

        if (result.conditions?.distance) {
            console.log("✅ Distance calculated successfully.");
        } else {
            console.log("⚠️ Distance MISSING (This might be expected if Away team city is unknown).");
        }

    } catch (e) {
        console.error("❌ Error:", e);
    } finally {
        await mongoose.disconnect();
        console.log("\nDisconnected.");
    }
}

run();
