
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Manually read .env.local
const envPath = path.resolve(".env.local");
let MONGO_URI = "";

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    const lines = envContent.split("\n");
    for (const line of lines) {
        if (line.startsWith("MONGO_URI=")) {
            // Take everything after the first =
            const val = line.substring(10).trim();
            // Remove wrapping quotes if present
            MONGO_URI = val.replace(/^["']|["']$/g, "");

            // Fix specific issue with empty appName if present
            if (MONGO_URI.includes("appName=") && !MONGO_URI.match(/appName=[^&]+/)) {
                // Remove appName= if it has no value (end of string)
                MONGO_URI = MONGO_URI.replace(/[?&]appName=$/, "");
            }
            break;
        }
    }
}

if (!MONGO_URI) {
    console.error("❌ No MONGO_URI found in .env.local");
    process.exit(1);
}

// Define minimal schema to access collection
const fixtureSchema = new mongoose.Schema({}, { strict: false });
const Fixture = mongoose.models.Fixture || mongoose.model("Fixture", fixtureSchema, "fixtures");

// Minimal League Schema
const leagueSchema = new mongoose.Schema({}, { strict: false });
const League = mongoose.models.League || mongoose.model("League", leagueSchema, "leagues");

async function countTeams() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Custom DB Connection Open");

        // Count distinct teams
        const distinctTeams = await Fixture.distinct("fixture.teams.home.id");
        console.log(`Total Unique Teams: ${distinctTeams.length}`);

        const distinctLeagues = await League.countDocuments({});
        console.log(`Total Active Leagues: ${distinctLeagues}`);

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

countTeams();
