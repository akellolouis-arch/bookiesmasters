import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Fixture from "./models/Fixture.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "./.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local"), override: true });

async function getPastMatches(teamId, beforeDate, limit = 10) {
    const matches = await Fixture.find({
        $or: [
            { "fixture.teams.home.id": teamId },
            { "fixture.teams.away.id": teamId }
        ],
        "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] },
        "fixture.fixture.date": { $lt: beforeDate }
    }).sort({ "fixture.fixture.date": -1 }).limit(limit).lean();
    return matches;
}

function calculateScores(matches) {
    if (!matches || matches.length === 0) return { ov15: 0, un35: 0 };
    
    let ov15Count = 0;
    let un35Count = 0;
    
    matches.forEach(m => {
        const goals = m.fixture.goals.home + m.fixture.goals.away;
        if (goals >= 2) ov15Count++;
        if (goals <= 3) un35Count++;
    });
    
    return {
        ov15: ov15Count / matches.length,
        un35: un35Count / matches.length,
        avgGoals: matches.reduce((acc, m) => acc + m.fixture.goals.home + m.fixture.goals.away, 0) / matches.length
    };
}

async function runTest() {
    try {
        const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";
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
    }).lean();

    console.log(`Found ${fixtures.length} finished fixtures yesterday.`);

    let wins = 0;
    let losses = 0;
    let ov15Picks = 0;
    let un35Picks = 0;

    for (const f of fixtures) {
        const matchData = f.fixture;
        const homeId = matchData.teams.home.id;
        const awayId = matchData.teams.away.id;
        const fixtureDate = matchData.fixture.date;

        const homeMatches = await getPastMatches(homeId, fixtureDate, 10);
        const awayMatches = await getPastMatches(awayId, fixtureDate, 10);

        // Skip if not enough data
        if (homeMatches.length < 5 || awayMatches.length < 5) continue;

        const homeStats = calculateScores(homeMatches);
        const awayStats = calculateScores(awayMatches);

        const combinedOv15 = (homeStats.ov15 + awayStats.ov15) / 2;
        const combinedUn35 = (homeStats.un35 + awayStats.un35) / 2;

        let prediction = "";
        if (combinedOv15 > combinedUn35) {
            prediction = "OV1.5";
            ov15Picks++;
        } else if (combinedUn35 > combinedOv15) {
            prediction = "UN3.5";
            un35Picks++;
        } else {
            // Tie breaker
            const combinedAvgGoals = (homeStats.avgGoals + awayStats.avgGoals) / 2;
            if (combinedAvgGoals > 2.5) {
                prediction = "OV1.5";
                ov15Picks++;
            } else {
                prediction = "UN3.5";
                un35Picks++;
            }
        }

        const actualGoals = matchData.goals.home + matchData.goals.away;
        let isWin = false;
        if (prediction === "OV1.5" && actualGoals >= 2) isWin = true;
        if (prediction === "UN3.5" && actualGoals <= 3) isWin = true;

        if (isWin) wins++;
        else losses++;
    }

    const totalValid = wins + losses;
    console.log("--------------------------------------------------");
    console.log(`Results on ${totalValid} valid fixtures:`);
    console.log(`OV1.5 Predictions: ${ov15Picks}`);
    console.log(`UN3.5 Predictions: ${un35Picks}`);
    console.log(`WINS: ${wins}`);
    console.log(`LOSSES: ${losses}`);
    console.log(`WIN RATE: ${totalValid > 0 ? ((wins / totalValid) * 100).toFixed(2) : 0}%`);
    console.log("--------------------------------------------------");

    } catch (err) {
        console.error("Test failed:", err);
    } finally {
        mongoose.disconnect();
        process.exit(0);
    }
}

runTest();
