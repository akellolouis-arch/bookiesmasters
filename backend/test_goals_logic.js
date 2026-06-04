import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Fixture from "./models/Fixture.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "./.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local"), override: true });

async function getPastMatches(teamId, beforeDate, limit = 10) {
    return await Fixture.find({
        $or: [
            { "fixture.teams.home.id": teamId },
            { "fixture.teams.away.id": teamId }
        ],
        "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] },
        "fixture.fixture.date": { $lt: beforeDate }
    }).sort({ "fixture.fixture.date": -1 }).limit(limit).lean();
}

async function getH2HMatches(team1Id, team2Id, beforeDate, limit = 10) {
    return await Fixture.find({
        $or: [
            { "fixture.teams.home.id": team1Id, "fixture.teams.away.id": team2Id },
            { "fixture.teams.home.id": team2Id, "fixture.teams.away.id": team1Id }
        ],
        "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] },
        "fixture.fixture.date": { $lt: beforeDate }
    }).sort({ "fixture.fixture.date": -1 }).limit(limit).lean();
}

function calculateMajority(matches) {
    if (!matches || matches.length === 0) return null; // No data

    let ov25 = 0;
    let un25 = 0;

    matches.forEach(m => {
        const goals = m.fixture.goals.home + m.fixture.goals.away;
        if (goals > 2.5) ov25++;
        else un25++;
    });

    return ov25 >= un25 ? "OV" : "UN";
}

async function runTest() {
    try {
        const MONGO_URI = process.env.MONGO_URI;
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        // Define 'yesterday' window
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const startOfYesterday = yesterday.toISOString();
        const endOfYesterday = today.toISOString();

        console.log(`Testing fixtures between ${startOfYesterday} and ${endOfYesterday}`);

        const fixtures = await Fixture.find({
            "fixture.fixture.date": { $gte: startOfYesterday, $lt: endOfYesterday },
            "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
        }).limit(50).lean();

        console.log(`Found ${fixtures.length} finished fixtures yesterday (limited to 50 for quick test).`);

        let stats = {
            wins: 0,
            losses: 0,
            skipped: 0,
            picks: {
                "OV2.5": { w: 0, l: 0 },
                "UN2.5": { w: 0, l: 0 },
                "OV1.5": { w: 0, l: 0 },
                "UN3.5": { w: 0, l: 0 }
            }
        };

        let processed = 0;

        for (const f of fixtures) {
            const matchData = f.fixture;
            const homeId = matchData.teams.home.id;
            const awayId = matchData.teams.away.id;
            const fixtureDate = matchData.fixture.date;

            const [homeMatches, awayMatches, h2hMatches] = await Promise.all([
                getPastMatches(homeId, fixtureDate, 9), // Use odd number for tie-breakers if possible
                getPastMatches(awayId, fixtureDate, 9),
                getH2HMatches(homeId, awayId, fixtureDate, 6)
            ]);

            // We want at least some data to base our logic on
            if (homeMatches.length < 3 || awayMatches.length < 3 || h2hMatches.length < 1) {
                stats.skipped++;
                continue;
            }

            const homeVote = calculateMajority(homeMatches);
            const awayVote = calculateMajority(awayMatches);
            const h2hVote = calculateMajority(h2hMatches);

            if (!homeVote || !awayVote || !h2hVote) {
                stats.skipped++;
                continue;
            }

            let ovVotes = 0;
            if (homeVote === "OV") ovVotes++;
            if (awayVote === "OV") ovVotes++;
            if (h2hVote === "OV") ovVotes++;

            let prediction = "";
            if (ovVotes === 3) prediction = "OV2.5";
            else if (ovVotes === 2) prediction = "OV1.5";
            else if (ovVotes === 1) prediction = "UN3.5";
            else if (ovVotes === 0) prediction = "UN2.5";

            const actualGoals = matchData.goals.home + matchData.goals.away;
            let isWin = false;

            if (prediction === "OV2.5" && actualGoals > 2.5) isWin = true;
            if (prediction === "UN2.5" && actualGoals < 2.5) isWin = true;
            if (prediction === "OV1.5" && actualGoals > 1.5) isWin = true;
            if (prediction === "UN3.5" && actualGoals < 3.5) isWin = true;

            if (isWin) {
                stats.wins++;
                stats.picks[prediction].w++;
            } else {
                stats.losses++;
                stats.picks[prediction].l++;
            }

            processed++;
            if (processed % 5 === 0) console.log(`Processed ${processed}/${fixtures.length}...`);
        }

        const totalValid = stats.wins + stats.losses;
        console.log("\n--------------------------------------------------");
        console.log(`Results for ${totalValid} valid fixtures (Skipped ${stats.skipped} due to low data):`);
        console.log(`OVERALL WINS: ${stats.wins}`);
        console.log(`OVERALL LOSSES: ${stats.losses}`);
        console.log(`OVERALL WIN RATE: ${totalValid > 0 ? ((stats.wins / totalValid) * 100).toFixed(2) : 0}%`);
        console.log("--------------------------------------------------");
        
        for (const [pick, res] of Object.entries(stats.picks)) {
            const total = res.w + res.l;
            const rate = total > 0 ? ((res.w / total) * 100).toFixed(2) : 0;
            console.log(`Pick [${pick}] -> Total: ${total} | Wins: ${res.w} | Losses: ${res.l} | Rate: ${rate}%`);
        }
        console.log("--------------------------------------------------");

    } catch (err) {
        console.error("Test failed:", err);
    } finally {
        mongoose.disconnect();
        process.exit(0);
    }
}

runTest();
