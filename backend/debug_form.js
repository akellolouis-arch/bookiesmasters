
import { calculateTeamForm } from "./helpers/formCalculator.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        // Use a team ID known to exist (e.g. from fixture 1451129)
        // I'll try searching for a fixture first to get a valid Team ID
        const Fixture = (await import("./models/Fixture.js")).default;
        const fixture = await Fixture.findOne().sort({ "fixture.fixture.date": -1 });

        if (!fixture) {
            console.log("No fixtures found.");
            process.exit(1);
        }

        const teamId = fixture.fixture.teams.home.id;
        console.log(`Testing Team ID: ${teamId} (${fixture.fixture.teams.home.name})`);

        const result = await calculateTeamForm(teamId);
        console.log("Result:", JSON.stringify(result, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
