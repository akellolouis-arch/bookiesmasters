require('dotenv').config({path: './.env'});
const mongoose = require('mongoose');
const Fixture = require('./models/Fixture.js').default;

const calculateStats = (matches, limit) => {
    const recent = matches.slice(0, limit);
    let stats = { total: 0, over25: 0, under25: 0 };
    recent.forEach((m) => {
        const homeGoals = m.fixture?.goals?.home ?? m.fixture?.score?.fulltime?.home;
        const awayGoals = m.fixture?.goals?.away ?? m.fixture?.score?.fulltime?.away;
        if (homeGoals !== undefined && homeGoals !== null && awayGoals !== undefined && awayGoals !== null) {
            const totalGoals = homeGoals + awayGoals;
            stats.total++;
            if (totalGoals > 2.5) stats.over25++; else stats.under25++;
        }
    });
    return stats;
};

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Set up start and end of yesterday
    const today = new Date();
    today.setHours(0,0,0,0);
    const yesterday = new Date(today.getTime() - 86400000);

    const matches = await Fixture.find({
        "fixture.fixture.date": { $gte: yesterday.toISOString(), $lt: today.toISOString() },
        "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
    });

    console.log(`Evaluating ${matches.length} finished matches from yesterday (${yesterday.toISOString().split('T')[0]})...`);

    let withH2H_total = 0;
    let withH2H_won = 0;

    let noH2H_total = 0;
    let noH2H_won = 0;

    for (let i = 0; i < matches.length; i++) {
        const doc = matches[i];
        const matchDate = doc.fixture.fixture.date;
        const homeId = doc.fixture.teams.home.id;
        const awayId = doc.fixture.teams.away.id;
        const actualGoals = doc.fixture.goals.home + doc.fixture.goals.away;

        const [homeMatches, awayMatches, h2hMatches] = await Promise.all([
            Fixture.find({
                $or: [{ "fixture.teams.home.id": homeId }, { "fixture.teams.away.id": homeId }],
                "fixture.fixture.date": { $lt: matchDate },
                "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
            }).sort({ "fixture.fixture.date": -1 }).limit(5),
            Fixture.find({
                $or: [{ "fixture.teams.home.id": awayId }, { "fixture.teams.away.id": awayId }],
                "fixture.fixture.date": { $lt: matchDate },
                "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
            }).sort({ "fixture.fixture.date": -1 }).limit(5),
            Fixture.find({
                $or: [
                    { "fixture.teams.home.id": homeId, "fixture.teams.away.id": awayId },
                    { "fixture.teams.home.id": awayId, "fixture.teams.away.id": homeId }
                ],
                "fixture.fixture.date": { $lt: matchDate },
                "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
            }).sort({ "fixture.fixture.date": -1 }).limit(5)
        ]);

        const homeStats = calculateStats(homeMatches, 5);
        const awayStats = calculateStats(awayMatches, 5);
        const h2hStats = calculateStats(h2hMatches, 5);

        // Logic 1: WITH H2H
        if (homeStats.total > 0 && awayStats.total > 0 && h2hStats.total > 0) {
            let tip = null;
            if (homeStats.over25 >= homeStats.under25 && awayStats.over25 >= awayStats.under25 && h2hStats.over25 >= h2hStats.under25) {
                tip = "OV1.5";
            } else if (homeStats.under25 >= homeStats.over25 && awayStats.under25 >= awayStats.over25 && h2hStats.under25 >= h2hStats.over25) {
                tip = "UN3.5";
            }
            if (tip) {
                withH2H_total++;
                if (tip === "OV1.5" && actualGoals > 1.5) withH2H_won++;
                if (tip === "UN3.5" && actualGoals < 3.5) withH2H_won++;
            }
        }

        // Logic 2: WITHOUT H2H
        if (homeStats.total > 0 && awayStats.total > 0) {
            let tip = null;
            if (homeStats.over25 >= homeStats.under25 && awayStats.over25 >= awayStats.under25) {
                tip = "OV1.5";
            } else if (homeStats.under25 >= homeStats.over25 && awayStats.under25 >= awayStats.over25) {
                tip = "UN3.5";
            }
            if (tip) {
                noH2H_total++;
                if (tip === "OV1.5" && actualGoals > 1.5) noH2H_won++;
                if (tip === "UN3.5" && actualGoals < 3.5) noH2H_won++;
            }
        }
    }

    console.log(`\n--- RESULTS: WITH H2H REQUIREMENT ---`);
    console.log(`Total Predictions: ${withH2H_total}`);
    console.log(`Won: ${withH2H_won}`);
    console.log(`Win Rate: ${((withH2H_won/withH2H_total)*100).toFixed(1)}%`);

    console.log(`\n--- RESULTS: WITHOUT H2H REQUIREMENT ---`);
    console.log(`Total Predictions: ${noH2H_total}`);
    console.log(`Won: ${noH2H_won}`);
    console.log(`Win Rate: ${((noH2H_won/noH2H_total)*100).toFixed(1)}%`);

    process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
