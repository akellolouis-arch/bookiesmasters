import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Fixture from "./models/Fixture.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function debugAlbania() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Find live matches in Albania
        const albaniaLive = await Fixture.find({
            "fixture.league.country": "Albania",
            "fixture.fixture.status.short": { $in: ["1H", "2H", "HT", "ET", "BT", "P", "SUSP", "INT"] }
        }).lean();

        console.log(`Found ${albaniaLive.length} live matches in Albania`);

        if (albaniaLive.length > 0) {
            for (const match of albaniaLive) {
                console.log(`\nMatch: ${match.fixture.teams.home.name} vs ${match.fixture.teams.away.name}`);
                console.log(`League: ${match.fixture.league.name} (${match.fixture.league.id})`);
                
                const awayTeamId = match.fixture.teams.away.id;
                console.log(`Checking away team ID: ${awayTeamId} (${match.fixture.teams.away.name})`);

                const awayTeamMatches = await Fixture.find({
                    $or: [
                        { "fixture.teams.home.id": awayTeamId },
                        { "fixture.teams.away.id": awayTeamId }
                    ]
                }).lean();

                console.log(`Total fixtures found in DB for away team: ${awayTeamMatches.length}`);

                const ftMatches = awayTeamMatches.filter(m => ["FT", "AET", "PEN"].includes(m.fixture.fixture.status.short));
                console.log(`Completed (FT) fixtures for away team: ${ftMatches.length}`);
                
                if (ftMatches.length > 0) {
                     ftMatches.sort((a, b) => new Date(b.fixture.fixture.date) - new Date(a.fixture.fixture.date));
                     console.log("Most recent 3 FT matches:");
                     ftMatches.slice(0, 3).forEach(m => console.log(`- ${m.fixture.fixture.date}: ${m.fixture.teams.home.name} vs ${m.fixture.teams.away.name} (${m.fixture.league.name})`));
                }
            }
        } else {
            console.log("No live matches found for Albania. Let's find ANY match for Albania today.");
            // get today's date bounds
            const today = new Date();
            today.setHours(0,0,0,0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const albaniaToday = await Fixture.find({
                "fixture.league.country": "Albania",
                "fixture.fixture.date": { $gte: today.toISOString(), $lt: tomorrow.toISOString() }
            }).lean();

            console.log(`Found ${albaniaToday.length} matches in Albania today`);
            for (const match of albaniaToday) {
                 console.log(`- ${match.fixture.teams.home.name} vs ${match.fixture.teams.away.name} (${match.fixture.fixture.status.short})`);
                 const awayTeamId = match.fixture.teams.away.id;
                 const awayTeamMatches = await Fixture.find({
                    $or: [
                        { "fixture.teams.home.id": awayTeamId },
                        { "fixture.teams.away.id": awayTeamId }
                    ]
                 }).lean();
                 const ft = awayTeamMatches.filter(m => ["FT", "AET", "PEN"].includes(m.fixture.fixture.status.short)).length;
                 console.log(`  Away team (${match.fixture.teams.away.name}) has ${awayTeamMatches.length} total, ${ft} FT matches in DB`);
            }
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

debugAlbania();
