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
        btts: 0,
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
            if (homeGoals > 0 && awayGoals > 0) stats.btts++;
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

async function test(dateStr) {
    const startOfDay = new Date(`${dateStr}T00:00:00+03:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999+03:00`);
    
    const docs = await Fixture.find({
        "fixture.fixture.date": { $gte: startOfDay.toISOString(), $lte: endOfDay.toISOString() },
        "fixture.league.name": { $not: /friendlies/i }
    });

    let countNewLogic = 0;
    
    for (const doc of docs) {
        const matchDate = doc.fixture.fixture.date;
        const homeId = doc.fixture.teams.home.id;
        const awayId = doc.fixture.teams.away.id;
        const leagueId = doc.fixture.league.id;
        
        const [homeMatchesLeague, awayMatchesLeague] = await Promise.all([
            Fixture.find({
                "fixture.league.id": leagueId,
                $or: [{ "fixture.teams.home.id": homeId }, { "fixture.teams.away.id": homeId }],
                "fixture.fixture.date": { $lt: matchDate },
                "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
            }).sort({ "fixture.fixture.date": -1 }).limit(5),
            Fixture.find({
                "fixture.league.id": leagueId,
                $or: [{ "fixture.teams.away.id": awayId }, { "fixture.teams.home.id": awayId }], // fixed away condition
                "fixture.fixture.date": { $lt: matchDate },
                "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
            }).sort({ "fixture.fixture.date": -1 }).limit(5)
        ]);

        const homeStatsLeague = calculateStats(homeMatchesLeague, 5);
        const awayStatsLeague = calculateStats(awayMatchesLeague, 5);
        const homeFormLeague = calculateWDL(homeMatchesLeague, homeId);
        const awayFormLeague = calculateWDL(awayMatchesLeague, awayId);

        let passHomeWin = false, passAwayWin = false, passOV25 = false, passBTTS = false, passUN25 = false;
        let passOV15 = false, passUN35 = false;

        // NEW LOGIC (Relaxed safety margin)
        if (homeStatsLeague.total >= 4 && awayStatsLeague.total >= 4) {
            passHomeWin = homeFormLeague.wins >= 4 && awayFormLeague.losses >= 4;
            passAwayWin = awayFormLeague.wins >= 4 && homeFormLeague.losses >= 4;
            passOV25 = homeStatsLeague.over25 >= 4 && awayStatsLeague.over25 >= 4; // changed from over35
            passBTTS = homeStatsLeague.btts >= 4 && awayStatsLeague.btts >= 4 && homeStatsLeague.over15 >= 4 && awayStatsLeague.over15 >= 4; // changed over25 to over15
            passUN25 = homeStatsLeague.under25 >= 4 && awayStatsLeague.under25 >= 4; // changed from under15
            passOV15 = homeStatsLeague.over15 >= 4 && awayStatsLeague.over15 >= 4; // changed from over25
            passUN35 = homeStatsLeague.under35 >= 4 && awayStatsLeague.under35 >= 4; // changed from under25
        }

        let tip = null;
        if (passHomeWin) tip = "1";
        else if (passAwayWin) tip = "2";
        else if (passOV25) tip = "OV2.5";
        else if (passBTTS) tip = "BTTS";
        else if (passUN25) tip = "UN2.5";
        else if (passOV15) tip = "OV1.5";
        else if (passUN35) tip = "UN3.5";

        if (tip) {
            countNewLogic++;
        }
    }
    
    console.log(`${dateStr}: ${countNewLogic} tips with relaxed logic.`);
}

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    await test("2026-08-12");
    mongoose.connection.close();
}

run();
