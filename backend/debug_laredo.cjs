const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const Fixture = require("./models/Fixture");

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected to MongoDB.");

        const query = {
            $or: [
                { "homeTeam.name": { $regex: /Laredo/i } },
                { "awayTeam.name": { $regex: /Laredo/i } }
            ]
        };

        const matches = await Fixture.find(query).sort({ date: -1 }).limit(5).lean();
        
        if (matches.length === 0) {
            console.log("No Laredo matches found.");
        }

        for (const m of matches) {
            console.log(`\nFixture ID: ${m.fixtureId}`);
            console.log(`Teams: ${m.homeTeam.name} vs ${m.awayTeam.name}`);
            console.log(`Date: ${m.date}`);
            console.log(`League: ${m.league} (${m.country})`);
            console.log(`Status: ${m.status}`);
            console.log(`Score: ${m.score?.home} - ${m.score?.away}`);
            console.log(`Last Updated: ${m.updatedAt || 'N/A'}`);
            console.log(`API response format check: Is there a raw format stored?`);
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
