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

async function checkYesterday() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

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
        console.log(`Found ${fixtures.length} completed fixtures for yesterday (${date}).`);

        let un25Tips = 0;
        let un25Won = 0;
        
        console.log("\n--- YESTERDAY'S MATCHES WITH UN2.5 TIPS ---");

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
            
            const homeStats = calculateStats(homeMatches, 5);
            const awayStats = calculateStats(awayMatches, 5);

            if (homeStats.total >= 4 && awayStats.total >= 4) {
                const passHomeWin = homeForm.wins >= 4 && awayForm.losses >= 4;
                const passAwayWin = awayForm.wins >= 4 && homeForm.losses >= 4;
                const passOV15 = homeStats.over25 >= 4 && awayStats.over25 >= 4;
                const passUN25 = homeStats.under15 >= 4 && awayStats.under15 >= 4;
                const passUN35 = homeStats.under25 >= 4 && awayStats.under25 >= 4;
                
                let tip = null;
                if (passHomeWin) tip = "1";
                else if (passAwayWin) tip = "2";
                else if (passUN25) tip = "UN2.5";
                else if (passOV15) tip = "OV1.5";
                else if (passUN35) tip = "UN3.5";

                if (tip === "UN2.5") {
                    un25Tips++;
                    const actualHomeGoals = doc.fixture.goals.home ?? doc.fixture.score.fulltime.home;
                    const actualAwayGoals = doc.fixture.goals.away ?? doc.fixture.score.fulltime.away;
                    const totalGoals = actualHomeGoals + actualAwayGoals;
                    
                    const won = totalGoals < 2.5;
                    if (won) un25Won++;

                    console.log(`[UN2.5] ${doc.fixture.teams.home.name} vs ${doc.fixture.teams.away.name} (League: ${doc.fixture.league?.name}) | Result: ${actualHomeGoals}-${actualAwayGoals} | Won: ${won}`);
                }
            }
        }

        console.log("\n--- SUMMARY ---");
        console.log(`Total 'UN2.5' Tips Yesterday: ${un25Tips}`);
        if (un25Tips > 0) {
            console.log(`Win Rate: ${((un25Won / un25Tips) * 100).toFixed(2)}% (${un25Won}/${un25Tips})`);
        }

        mongoose.connection.close();
    } catch (e) {
        console.error(e);
        mongoose.connection.close();
    }
}

checkYesterday();
