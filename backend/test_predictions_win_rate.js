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
        console.log("Connected to DB\n");

        const datesToTest = ["2026-06-04", "2026-06-03", "2026-06-02", "2026-06-01", "2026-05-31"];
        
        let overallResults = {
            totalMatches: 0,
            predictionsMade: 0,
            markets: {
                OV15: { predicted: 0, won: 0 },
                UN35: { predicted: 0, won: 0 }
            }
        };

        for (const dateStr of datesToTest) {
            const startOfDay = new Date(`${dateStr}T00:00:00+03:00`);
            const endOfDay = new Date(`${dateStr}T23:59:59.999+03:00`);

            const fixtures = await Fixture.find({
                "fixture.fixture.date": {
                    $gte: startOfDay.toISOString(),
                    $lte: endOfDay.toISOString()
                },
                "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
            }).sort({ "fixture.fixture.date": 1 });

            let dailyResults = {
                totalMatches: fixtures.length,
                predictionsMade: 0,
                markets: {
                    OV15: { predicted: 0, won: 0 },
                    UN35: { predicted: 0, won: 0 }
                }
            };

            for (const f of fixtures) {
                const matchDate = f.fixture.fixture.date;
                const homeId = f.fixture.teams.home.id;
                const awayId = f.fixture.teams.away.id;
                
                const actualHomeGoals = f.fixture.goals?.home ?? 0;
                const actualAwayGoals = f.fixture.goals?.away ?? 0;
                const actualTotal = actualHomeGoals + actualAwayGoals;

                const homeMatches = await Fixture.find({
                    $or: [{ "fixture.teams.home.id": homeId }, { "fixture.teams.away.id": homeId }],
                    "fixture.fixture.date": { $lt: matchDate },
                    "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
                }).sort({ "fixture.fixture.date": -1 }).limit(5);

                const awayMatches = await Fixture.find({
                    $or: [{ "fixture.teams.home.id": awayId }, { "fixture.teams.away.id": awayId }],
                    "fixture.fixture.date": { $lt: matchDate },
                    "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
                }).sort({ "fixture.fixture.date": -1 }).limit(5);

                const h2hMatches = await Fixture.find({
                    $or: [
                        { "fixture.teams.home.id": homeId, "fixture.teams.away.id": awayId },
                        { "fixture.teams.home.id": awayId, "fixture.teams.away.id": homeId }
                    ],
                    "fixture.fixture.date": { $lt: matchDate },
                    "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
                }).sort({ "fixture.fixture.date": -1 }).limit(5);

                const homeStats = calculateStats(homeMatches, 5);
                const awayStats = calculateStats(awayMatches, 5);
                const h2hStats = calculateStats(h2hMatches, 5);

                if (homeStats.total === 0 || awayStats.total === 0 || h2hStats.total === 0) {
                    continue;
                }

                let prediction = null;

                if (homeStats.over25 >= homeStats.under25 && awayStats.over25 >= awayStats.under25 && h2hStats.over25 >= h2hStats.under25) {
                    prediction = "OV15";
                } else if (homeStats.under25 >= homeStats.over25 && awayStats.under25 >= awayStats.over25 && h2hStats.under25 >= h2hStats.over25) {
                    prediction = "UN35";
                }

                if (prediction) {
                    dailyResults.predictionsMade++;
                    overallResults.predictionsMade++;
                    
                    dailyResults.markets[prediction].predicted++;
                    overallResults.markets[prediction].predicted++;
                    
                    let won = false;
                    if (prediction === "OV15" && actualTotal > 1.5) won = true;
                    if (prediction === "UN35" && actualTotal < 3.5) won = true;

                    if (won) {
                        dailyResults.markets[prediction].won++;
                        overallResults.markets[prediction].won++;
                    }
                }
            }

            // Print Daily Results
            console.log(`[${dateStr}] Matches: ${dailyResults.totalMatches} | Predictions: ${dailyResults.predictionsMade}`);
            for (const [market, data] of Object.entries(dailyResults.markets)) {
                if (data.predicted > 0) {
                    const winRate = ((data.won / data.predicted) * 100).toFixed(1);
                    console.log(`  -> ${market}: ${data.won}/${data.predicted} (${winRate}%)`);
                } else {
                    console.log(`  -> ${market}: No predictions`);
                }
            }
            console.log("-----------------------------------------");

            overallResults.totalMatches += dailyResults.totalMatches;
        }

        console.log("\n=== 5-DAY OVERALL TOTALS ===");
        console.log(`Total Matches: ${overallResults.totalMatches}`);
        console.log(`Predictions Made: ${overallResults.predictionsMade} (${((overallResults.predictionsMade/overallResults.totalMatches)*100).toFixed(1)}%)`);
        
        for (const [market, data] of Object.entries(overallResults.markets)) {
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
