import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "../.env.local" });

const calculateWDL = (matches, teamId) => {
    let wins = 0, draws = 0, losses = 0;
    matches.forEach((m) => {
        const isHome = m.fixture.teams.home.id === teamId;
        const homeGoals = m.fixture.goals?.home ?? 0;
        const awayGoals = m.fixture.goals?.away ?? 0;

        if (homeGoals === awayGoals) {
            draws++;
        } else if (isHome) {
            homeGoals > awayGoals ? wins++ : losses++;
        } else {
            awayGoals > homeGoals ? wins++ : losses++;
        }
    });
    return { wins, draws, losses };
};

const calculateStats = (matches, limit) => {
    const recent = matches.slice(0, limit);
    let btts = 0, over15 = 0, over25 = 0, under25 = 0, under35 = 0;
    
    recent.forEach(doc => {
        const m = doc.fixture || doc;
        const homeGoals = m.goals?.home ?? 0;
        const awayGoals = m.goals?.away ?? 0;
        const totalGoals = homeGoals + awayGoals;
        
        if (homeGoals > 0 && awayGoals > 0) btts++;
        if (totalGoals > 1.5) over15++;
        if (totalGoals > 2.5) over25++;
        if (totalGoals < 2.5) under25++;
        if (totalGoals < 3.5) under35++;
    });
    return { total: recent.length, btts, over15, over25, under25, under35 };
};

mongoose.connect(process.env.MONGO_URI).then(async () => { 
  const collection = mongoose.connection.db.collection('fixtures');
  
  const matches = await collection.find({
    "fixture.fixture.date": { $gte: "2026-07-25T00:00:00+03:00", $lte: "2026-07-25T23:59:59.999+03:00" }
  }).toArray();
  
  let validCount = 0;
  
  for (const match of matches) {
      if (match.fixture.league.name.toLowerCase().includes("friendlies")) continue;
      
      const homeId = match.fixture.teams.home.id;
      const awayId = match.fixture.teams.away.id;
      const leagueId = match.fixture.league.id;
      const matchDate = match.fixture.fixture.date;
      
      const Fixture = mongoose.model("Fixture", new mongoose.Schema({}, {strict: false}), "fixtures");
      
      const homeMatchesLeague = await Fixture.find({
          "fixture.league.id": leagueId,
          $or: [{ "fixture.teams.home.id": homeId }, { "fixture.teams.away.id": homeId }],
          "fixture.fixture.date": { $lt: matchDate },
          "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
      }).sort({ "fixture.fixture.date": -1 }).limit(5);
      
      const awayMatchesLeague = await Fixture.find({
          "fixture.league.id": leagueId,
          $or: [{ "fixture.teams.home.id": awayId }, { "fixture.teams.away.id": awayId }],
          "fixture.fixture.date": { $lt: matchDate },
          "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
      }).sort({ "fixture.fixture.date": -1 }).limit(5);
      
      const homeMatchesAll = await Fixture.find({
          $or: [{ "fixture.teams.home.id": homeId }, { "fixture.teams.away.id": homeId }],
          "fixture.fixture.date": { $lt: matchDate },
          "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
      }).sort({ "fixture.fixture.date": -1 }).limit(5);
      
      const awayMatchesAll = await Fixture.find({
          $or: [{ "fixture.teams.home.id": awayId }, { "fixture.teams.away.id": awayId }],
          "fixture.fixture.date": { $lt: matchDate },
          "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
      }).sort({ "fixture.fixture.date": -1 }).limit(5);

      const homeStatsLeague = calculateStats(homeMatchesLeague, 5);
      const awayStatsLeague = calculateStats(awayMatchesLeague, 5);
      const homeFormLeague = calculateWDL(homeMatchesLeague, homeId);
      const awayFormLeague = calculateWDL(awayMatchesLeague, awayId);
      
      const homeStatsAll = calculateStats(homeMatchesAll, 5);
      const awayStatsAll = calculateStats(awayMatchesAll, 5);

      let passHomeWin = false, passAwayWin = false, passOV25 = false, passBTTS = false, passUN25 = false;
      let passOV15 = false, passUN35 = false;

      // FIXED LOGIC
      if (homeStatsLeague.total >= 4 && awayStatsLeague.total >= 4) {
          passHomeWin = homeFormLeague.wins >= 4 && awayFormLeague.losses >= 4;
          passAwayWin = awayFormLeague.wins >= 4 && homeFormLeague.losses >= 4;
          passOV25 = homeStatsLeague.over25 >= 4 && awayStatsLeague.over25 >= 4; // WAS over35
          passBTTS = homeStatsLeague.btts >= 4 && awayStatsLeague.btts >= 4 && homeStatsLeague.over25 >= 4 && awayStatsLeague.over25 >= 4;
          passUN25 = homeStatsLeague.under25 >= 4 && awayStatsLeague.under25 >= 4; // WAS under15
      }

      if (homeStatsAll.total >= 4 && awayStatsAll.total >= 4) {
          passOV15 = homeStatsAll.over15 >= 4 && awayStatsAll.over15 >= 4; // WAS over25
          passUN35 = homeStatsAll.under35 >= 4 && awayStatsAll.under35 >= 4; // WAS under25
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
          validCount++;
      }
  }
  
  console.log(`With fixed logical thresholds, Saturday has ${validCount} predictions.`);
  process.exit(0); 
}).catch(console.error);
