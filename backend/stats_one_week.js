import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Fixture from "./models/Fixture.js";

dotenv.config({ path: path.resolve(process.cwd(), "..", ".env.local") });

async function analyzePredictions() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const fixtures = await Fixture.find({
            "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] },
            "fixture.fixture.date": { $gte: sevenDaysAgo.toISOString() },
            "predictionTip": { $exists: true, $ne: "NONE" }
        }).lean();

        console.log(`Found ${fixtures.length} completed fixtures with a prediction in the last 7 days.`);

        const stats = {
            "1": { total: 0, wins: 0, losses: 0 },
            "2": { total: 0, wins: 0, losses: 0 },
            "OV2.5": { total: 0, wins: 0, losses: 0 },
            "OV1.5": { total: 0, wins: 0, losses: 0 },
            "UN2.5": { total: 0, wins: 0, losses: 0 },
            "UN3.5": { total: 0, wins: 0, losses: 0 },
            "BTTS": { total: 0, wins: 0, losses: 0 },
        };

        for (const f of fixtures) {
            const tip = f.predictionTip;
            if (!stats[tip]) {
                stats[tip] = { total: 0, wins: 0, losses: 0 };
            }

            const homeGoals = f.fixture?.goals?.home ?? f.fixture?.score?.fulltime?.home;
            const awayGoals = f.fixture?.goals?.away ?? f.fixture?.score?.fulltime?.away;

            if (homeGoals === undefined || awayGoals === undefined || homeGoals === null || awayGoals === null) {
                continue;
            }

            const totalGoals = homeGoals + awayGoals;
            let won = false;

            if (tip === "1") won = homeGoals > awayGoals;
            else if (tip === "2") won = awayGoals > homeGoals;
            else if (tip === "OV2.5") won = totalGoals > 2.5;
            else if (tip === "OV1.5") won = totalGoals > 1.5;
            else if (tip === "UN2.5") won = totalGoals < 2.5;
            else if (tip === "UN3.5") won = totalGoals < 3.5;
            else if (tip === "BTTS") won = homeGoals > 0 && awayGoals > 0;

            stats[tip].total++;
            if (won) {
                stats[tip].wins++;
            } else {
                stats[tip].losses++;
            }
        }

        console.log("\n--- One Week Prediction Stats ---");
        const sortedStats = Object.entries(stats).sort((a, b) => b[1].losses - a[1].losses);
        for (const [tip, data] of sortedStats) {
            if (data.total > 0) {
                const lossRate = ((data.losses / data.total) * 100).toFixed(2);
                console.log(`${tip}: ${data.losses} losses out of ${data.total} predictions (Loss Rate: ${lossRate}%)`);
            }
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

analyzePredictions();
