import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Fixture from './models/Fixture.js';

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
        const homeGoals = m.fixture?.goals?.home ?? m.fixture?.score?.fulltime?.home;
        const awayGoals = m.fixture?.goals?.away ?? m.fixture?.score?.fulltime?.away;
        
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

const calculateWDL = (matches, teamId) => {
    let stats = { total: 0, wins: 0, draws: 0, losses: 0 };
    
    matches.forEach(m => {
        const hId = m.fixture.teams.home.id;
        const aId = m.fixture.teams.away.id;
        const hGoals = m.fixture?.goals?.home ?? m.fixture?.score?.fulltime?.home;
        const aGoals = m.fixture?.goals?.away ?? m.fixture?.score?.fulltime?.away;
        
        if (hGoals !== undefined && aGoals !== undefined && hGoals !== null && aGoals !== null) {
            stats.total++;
            const isHome = (teamId === hId);
            const teamGoals = isHome ? hGoals : aGoals;
            const oppGoals = isHome ? aGoals : hGoals;
            
            if (teamGoals > oppGoals) stats.wins++;
            else if (teamGoals < oppGoals) stats.losses++;
            else stats.draws++;
        }
    });
    return stats;
};

async function runBacktest() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const date = "2026-06-14";
        const startOfDayKenya = new Date(`${date}T00:00:00+03:00`);
        const endOfDayKenya = new Date(`${date}T23:59:59.999+03:00`);

        const matchFilter = {
            "fixture.fixture.date": {
                $gte: startOfDayKenya.toISOString(),
                $lte: endOfDayKenya.toISOString()
            },
            "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
        };

        const fixtures = await Fixture.find(matchFilter);
        console.log(`Found ${fixtures.length} completed fixtures for ${date}.`);

        let homeWinTips = 0;
        let homeWinSuccess = 0;
        let awayWinTips = 0;
        let awayWinSuccess = 0;

        let totalPredictions = 0;
        let totalSuccess = 0;

        for (const doc of fixtures) {
            const matchDate = doc.fixture.fixture.date;
            const homeId = doc.fixture.teams.home.id;
            const awayId = doc.fixture.teams.away.id;

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

            const homeForm = calculateWDL(homeMatches, homeId);
            const awayForm = calculateWDL(awayMatches, awayId);

            if (homeForm.total >= 4 && awayForm.total >= 4) {
                const passHomeWin = homeForm.wins >= 4 && awayForm.losses >= 4;
                const passAwayWin = awayForm.wins >= 4 && homeForm.losses >= 4;
                
                let tip = null;
                if (passHomeWin) tip = "HOME WIN";
                else if (passAwayWin) tip = "AWAY WIN";

                if (tip) {
                    const actualHomeGoals = doc.fixture.goals.home ?? doc.fixture.score.fulltime.home;
                    const actualAwayGoals = doc.fixture.goals.away ?? doc.fixture.score.fulltime.away;
                    
                    let won = false;
                    if (tip === "HOME WIN" && actualHomeGoals > actualAwayGoals) {
                        won = true;
                        homeWinSuccess++;
                    } else if (tip === "AWAY WIN" && actualAwayGoals > actualHomeGoals) {
                        won = true;
                        awayWinSuccess++;
                    }

                    if (tip === "HOME WIN") homeWinTips++;
                    if (tip === "AWAY WIN") awayWinTips++;

                    totalPredictions++;
                    if (won) totalSuccess++;

                    console.log(`[${tip}] ${doc.fixture.teams.home.name} vs ${doc.fixture.teams.away.name} | Result: ${actualHomeGoals}-${actualAwayGoals} | Won: ${won}`);
                }
            }
        }

        console.log("\n--- RESULTS ---");
        console.log(`Total '1/2' Tips Generated: ${totalPredictions}`);
        if (totalPredictions > 0) {
            console.log(`Win Rate: ${((totalSuccess / totalPredictions) * 100).toFixed(2)}% (${totalSuccess}/${totalPredictions})`);
            console.log(`Home Win Tips: ${homeWinTips} (Won: ${homeWinSuccess})`);
            console.log(`Away Win Tips: ${awayWinTips} (Won: ${awayWinSuccess})`);
        } else {
            console.log("No tips matched the criteria.");
        }

        mongoose.connection.close();
    } catch (e) {
        console.error(e);
        mongoose.connection.close();
    }
}

runBacktest();
