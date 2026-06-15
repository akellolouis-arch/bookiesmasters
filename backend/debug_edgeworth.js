import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Fixture from './models/Fixture.js';

dotenv.config();

async function debug() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected");

    const matches = await Fixture.find({
        "fixture.teams.home.name": { $regex: /Edgeworth/i },
        "fixture.teams.away.name": { $regex: /Cooks Hill/i },
        "fixture.fixture.date": { $regex: /2026-06-13/ }
    });

    if (matches.length === 0) {
        console.log("Match not found");
        process.exit(0);
    }

    const doc = matches[0];
    console.log(`Match: ${doc.fixture.teams.home.name} vs ${doc.fixture.teams.away.name}`);
    console.log(`Current Prediction Tip: ${doc.predictionTip}`);
    
    const homeId = doc.fixture.teams.home.id;
    const awayId = doc.fixture.teams.away.id;
    const matchDate = doc.fixture.fixture.date;

    const [homeMatches, awayMatches] = await Promise.all([
        Fixture.find({
            $or: [{ "fixture.teams.home.id": homeId }, { "fixture.teams.away.id": homeId }],
            "fixture.fixture.date": { $lt: matchDate },
            "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
        }).sort({ "fixture.fixture.date": -1 }).limit(5),

        Fixture.find({
            $or: [{ "fixture.teams.home.id": awayId }, { "fixture.teams.away.id": awayId }],
            "fixture.fixture.date": { $lt: matchDate },
            "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
        }).sort({ "fixture.fixture.date": -1 }).limit(5)
    ]);

    const calculateStats = (mArr, limit) => {
        const recent = mArr.slice(0, limit);
        let stats = { total: 0, over15: 0, under15: 0, over25: 0, under25: 0, over35: 0, under35: 0, btts: 0 };
        recent.forEach((m) => {
            const homeGoals = m.fixture?.goals?.home ?? m.fixture?.score?.fulltime?.home;
            const awayGoals = m.fixture?.goals?.away ?? m.fixture?.score?.fulltime?.away;
            if (homeGoals !== undefined && homeGoals !== null && awayGoals !== undefined && awayGoals !== null) {
                const totalGoals = homeGoals + awayGoals;
                stats.total++;
                if (totalGoals > 1.5) stats.over15++; else stats.under15++;
                if (totalGoals > 2.5) stats.over25++; else stats.under25++;
                if (totalGoals > 3.5) stats.over35++; else stats.under35++;
                if (homeGoals > 0 && awayGoals > 0) stats.btts++;
            }
        });
        return stats;
    };

    const homeStats = calculateStats(homeMatches, 5);
    const awayStats = calculateStats(awayMatches, 5);

    console.log("Home Stats:", homeStats);
    console.log("Away Stats:", awayStats);
    
    mongoose.connection.close();
}

debug();
