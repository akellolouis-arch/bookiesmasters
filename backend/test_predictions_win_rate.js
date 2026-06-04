import mongoose from "mongoose";
import dotenv from "dotenv";
import Fixture from "./models/Fixture.js";

dotenv.config();

const calculateStats = (matches, limit) => {
    const recent = matches.slice(0, limit);
    let stats = {
        total: 0,
        over15: 0, under15: 0,
        over25: 0, under25: 0,
        over35: 0, under35: 0,
    };

    recent.forEach((m) => {
        const homeGoals = m.fixture.goals?.home ?? m.fixture.score?.fulltime?.home;
        const awayGoals = m.fixture.goals?.away ?? m.fixture.score?.fulltime?.away;
        
        if (homeGoals !== undefined && homeGoals !== null && awayGoals !== undefined && awayGoals !== null) {
            const totalGoals = homeGoals + awayGoals;
            stats.total++;
            
            if (totalGoals > 1.5) stats.over15++; else stats.under15++;
            if (totalGoals > 2.5) stats.over25++; else stats.under25++;
            if (totalGoals > 3.5) stats.over35++; else stats.under35++;
        }
    });

    return stats;
};

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Connected to DB");

        // Get yesterday's date in Kenya time (UTC+3)
        // Today is 2026-06-04, so yesterday was 2026-06-03
        const dateStr = "2026-06-01";
        const startOfDay = new Date(`${dateStr}T00:00:00+03:00`);
        const endOfDay = new Date(`${dateStr}T23:59:59.999+03:00`);

        const yesterdayFixtures = await Fixture.find({
            "fixture.fixture.date": {
                $gte: startOfDay.toISOString(),
                $lte: endOfDay.toISOString()
            },
            "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
        }).sort({ "fixture.fixture.date": 1 });

        console.log(`Found ${yesterdayFixtures.length} FT matches on ${dateStr}`);

        let results = {
            totalMatches: yesterdayFixtures.length,
            predictionsMade: 0,
            markets: {
                OV35: { predicted: 0, won: 0 },
                OV25: { predicted: 0, won: 0 },
                OV15: { predicted: 0, won: 0 },
                UN25: { predicted: 0, won: 0 },
                UN35: { predicted: 0, won: 0 }
            }
        };

        for (const f of yesterdayFixtures) {
            const matchDate = f.fixture.fixture.date;
            const homeId = f.fixture.teams.home.id;
            const awayId = f.fixture.teams.away.id;
            
            const actualHomeGoals = f.fixture.goals?.home ?? 0;
            const actualAwayGoals = f.fixture.goals?.away ?? 0;
            const actualTotal = actualHomeGoals + actualAwayGoals;

            // Get last 9 for Home
            const homeMatches = await Fixture.find({
                $or: [{ "fixture.teams.home.id": homeId }, { "fixture.teams.away.id": homeId }],
                "fixture.fixture.date": { $lt: matchDate },
                "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
            }).sort({ "fixture.fixture.date": -1 }).limit(9);

            // Get last 9 for Away
            const awayMatches = await Fixture.find({
                $or: [{ "fixture.teams.home.id": awayId }, { "fixture.teams.away.id": awayId }],
                "fixture.fixture.date": { $lt: matchDate },
                "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
            }).sort({ "fixture.fixture.date": -1 }).limit(9);

            // Get last 9 H2H
            const h2hMatches = await Fixture.find({
                $or: [
                    { "fixture.teams.home.id": homeId, "fixture.teams.away.id": awayId },
                    { "fixture.teams.home.id": awayId, "fixture.teams.away.id": homeId }
                ],
                "fixture.fixture.date": { $lt: matchDate },
                "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
            }).sort({ "fixture.fixture.date": -1 }).limit(9);

            const homeStats = calculateStats(homeMatches, 9);
            const awayStats = calculateStats(awayMatches, 9);
            const h2hStats = calculateStats(h2hMatches, 9);

            if (homeStats.total === 0 || awayStats.total === 0 || h2hStats.total === 0) {
                // Not enough data, skip prediction
                continue;
            }

            let prediction = null;

            // Waterfall logic
            if (homeStats.over35 >= homeStats.under35 && awayStats.over35 >= awayStats.under35 && h2hStats.over35 >= h2hStats.under35) {
                prediction = "OV35";
            } else if (homeStats.over25 >= homeStats.under25 && awayStats.over25 >= awayStats.under25 && h2hStats.over25 >= h2hStats.under25) {
                prediction = "OV25";
            } else if (homeStats.over15 >= homeStats.under15 && awayStats.over15 >= awayStats.under15 && h2hStats.over15 >= h2hStats.under15) {
                prediction = "OV15";
            } else if (homeStats.under25 >= homeStats.over25 && awayStats.under25 >= awayStats.over25 && h2hStats.under25 >= h2hStats.over25) {
                prediction = "UN25";
            } else if (homeStats.under35 >= homeStats.over35 && awayStats.under35 >= awayStats.over35 && h2hStats.under35 >= h2hStats.over35) {
                prediction = "UN35";
            }

            if (prediction) {
                results.predictionsMade++;
                results.markets[prediction].predicted++;
                
                let won = false;
                if (prediction === "OV35" && actualTotal > 3.5) won = true;
                if (prediction === "OV25" && actualTotal > 2.5) won = true;
                if (prediction === "OV15" && actualTotal > 1.5) won = true;
                if (prediction === "UN25" && actualTotal < 2.5) won = true;
                if (prediction === "UN35" && actualTotal < 3.5) won = true;

                if (won) {
                    results.markets[prediction].won++;
                }
            }
        }

        console.log("\n=== RESULTS ===");
        console.log(`Total Matches: ${results.totalMatches}`);
        console.log(`Predictions Made: ${results.predictionsMade} (${((results.predictionsMade/results.totalMatches)*100).toFixed(1)}%)`);
        
        console.log("\n--- WIN RATES ---");
        for (const [market, data] of Object.entries(results.markets)) {
            if (data.predicted > 0) {
                const winRate = ((data.won / data.predicted) * 100).toFixed(1);
                console.log(`${market}: ${data.won} / ${data.predicted} (${winRate}%)`);
            } else {
                console.log(`${market}: No predictions made.`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

runTest();
