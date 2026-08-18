import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Fixture from './models/Fixture.js';

dotenv.config();

const calculateStats = (matches, limit) => {
  let stats = { total: 0, over15: 0, over25: 0, over35: 0, under15: 0, under25: 0, under35: 0, btts: 0 };
  
  const recent = matches.slice(0, limit).filter(m => {
      const h = m.fixture?.goals?.home ?? m.fixture?.score?.fulltime?.home;
      const a = m.fixture?.goals?.away ?? m.fixture?.score?.fulltime?.away;
      return h !== undefined && h !== null && a !== undefined && a !== null;
  });

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

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    try {
        const match = await Fixture.findOne({
            "fixture.teams.home.name": "Vasco DA Gama",
            "fixture.teams.away.name": "Olimpia"
        });
        
        console.log(`Match found: ${match.fixture.teams.home.name} vs ${match.fixture.teams.away.name}`);
        console.log(`Prediction Tip: ${match.predictionTip}`);
        
        const homeId = match.fixture.teams.home.id;
        const awayId = match.fixture.teams.away.id;
        const leagueId = match.fixture.league.id;
        const matchDate = match.fixture.fixture.date;
        
        const [homeMatchesLeague, awayMatchesLeague] = await Promise.all([
            Fixture.find({
                "fixture.league.id": leagueId,
                $or: [{ "fixture.teams.home.id": homeId }, { "fixture.teams.away.id": homeId }],
                "fixture.fixture.date": { $lt: matchDate },
                "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
            }).sort({ "fixture.fixture.date": -1 }).limit(5),
            Fixture.find({
                "fixture.league.id": leagueId,
                $or: [{ "fixture.teams.away.id": awayId }, { "fixture.teams.home.id": awayId }],
                "fixture.fixture.date": { $lt: matchDate },
                "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
            }).sort({ "fixture.fixture.date": -1 }).limit(5)
        ]);
        
        console.log(`\nHome Team League Matches (${homeMatchesLeague.length}):`);
        homeMatchesLeague.forEach(m => {
            const h = m.fixture.teams.home.name;
            const a = m.fixture.teams.away.name;
            const goals = (m.fixture.goals.home ?? 0) + (m.fixture.goals.away ?? 0);
            console.log(`  ${h} vs ${a} -> ${m.fixture.goals.home}-${m.fixture.goals.away} (Total: ${goals})`);
        });
        
        console.log(`\nAway Team League Matches (${awayMatchesLeague.length}):`);
        awayMatchesLeague.forEach(m => {
            const h = m.fixture.teams.home.name;
            const a = m.fixture.teams.away.name;
            const goals = (m.fixture.goals.home ?? 0) + (m.fixture.goals.away ?? 0);
            console.log(`  ${h} vs ${a} -> ${m.fixture.goals.home}-${m.fixture.goals.away} (Total: ${goals})`);
        });
        
        const homeStatsLeague = calculateStats(homeMatchesLeague, 5);
        const awayStatsLeague = calculateStats(awayMatchesLeague, 5);
        
        console.log(`\nHome Stats: total=${homeStatsLeague.total}, over25=${homeStatsLeague.over25}, over35=${homeStatsLeague.over35}`);
        console.log(`Away Stats: total=${awayStatsLeague.total}, over25=${awayStatsLeague.over25}, over35=${awayStatsLeague.over35}`);
        
    } catch (err) {
        console.error(err);
    }
    mongoose.connection.close();
}
run();
