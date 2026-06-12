require('dotenv').config({path: './.env'});
const mongoose = require('mongoose');
const Fixture = require('./models/Fixture.js').default;

const calculateStats = (matches, limit) => {
    const recent = matches.slice(0, limit);
    let stats = {
        total: 0,
        over25: 0, under25: 0,
    };
  
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

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // get last 5000 finished fixtures
  const fixtures = await Fixture.find({
    "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
  }).sort({"fixture.fixture.date": -1}).limit(2000).lean();

  let withH2H = { total: 0, won: 0 };
  let withoutH2H = { total: 0, won: 0 };

  console.log(`Evaluating ${fixtures.length} recent matches...`);

  for(let i = 0; i < fixtures.length; i++) {
      const doc = fixtures[i];
      const matchDate = doc.fixture.fixture.date;
      const homeId = doc.fixture.teams.home.id;
      const awayId = doc.fixture.teams.away.id;

      const homeGoals = doc.fixture?.goals?.home ?? doc.fixture?.score?.fulltime?.home;
      const awayGoals = doc.fixture?.goals?.away ?? doc.fixture?.score?.fulltime?.away;

      if(homeGoals == null || awayGoals == null) continue;
      const totalGoals = homeGoals + awayGoals;

      const homeMatches = await Fixture.find({
        $or: [{ "fixture.teams.home.id": homeId }, { "fixture.teams.away.id": homeId }],
        "fixture.fixture.date": { $lt: matchDate },
        "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
      }).sort({ "fixture.fixture.date": -1 }).limit(5).lean();

      const awayMatches = await Fixture.find({
        $or: [{ "fixture.teams.home.id": awayId }, { "fixture.teams.away.id": awayId }],
        "fixture.fixture.date": { $lt: matchDate },
        "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
      }).sort({ "fixture.fixture.date": -1 }).limit(5).lean();

      const h2hMatches = await Fixture.find({
        $or: [
            { "fixture.teams.home.id": homeId, "fixture.teams.away.id": awayId },
            { "fixture.teams.home.id": awayId, "fixture.teams.away.id": homeId }
        ],
        "fixture.fixture.date": { $lt: matchDate },
        "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
      }).sort({ "fixture.fixture.date": -1 }).limit(5).lean();

      const homeStats = calculateStats(homeMatches, 5);
      const awayStats = calculateStats(awayMatches, 5);
      const h2hStats = calculateStats(h2hMatches, 5);

      if (homeStats.total > 0 && awayStats.total > 0) {
          // logic WITHOUT H2H
          const passOV25_noH2H = homeStats.over25 >= homeStats.under25 && awayStats.over25 >= awayStats.under25;
          const passUN25_noH2H = homeStats.under25 >= homeStats.over25 && awayStats.under25 >= awayStats.over25;
          
          let tipNoH2H = null;
          if (passOV25_noH2H || passUN25_noH2H) {
              tipNoH2H = passOV25_noH2H ? "OV1.5" : "UN3.5";
          }

          if(tipNoH2H) {
              withoutH2H.total++;
              if(tipNoH2H === "OV1.5" && totalGoals > 1.5) withoutH2H.won++;
              else if(tipNoH2H === "UN3.5" && totalGoals < 3.5) withoutH2H.won++;
          }

          // logic WITH H2H
          if(h2hStats.total > 0) {
              const passOV25 = passOV25_noH2H && h2hStats.over25 >= h2hStats.under25;
              const passUN25 = passUN25_noH2H && h2hStats.under25 >= h2hStats.over25;

              let tipWithH2H = null;
              if (passOV25 || passUN25) {
                  tipWithH2H = passOV25 ? "OV1.5" : "UN3.5";
              }

              if(tipWithH2H) {
                  withH2H.total++;
                  if(tipWithH2H === "OV1.5" && totalGoals > 1.5) withH2H.won++;
                  else if(tipWithH2H === "UN3.5" && totalGoals < 3.5) withH2H.won++;
              }
          }
      }
  }

  console.log("-----------------------------------------");
  console.log("WIN RATE COMPARISON (Last 2000 matches)");
  console.log("-----------------------------------------");
  console.log(`WITH H2H LOGIC:`);
  console.log(`Total Predictions: ${withH2H.total}`);
  console.log(`Wins: ${withH2H.won}`);
  console.log(`Win Rate: ${((withH2H.won / Math.max(1, withH2H.total)) * 100).toFixed(1)}%`);
  console.log("");
  console.log(`WITHOUT H2H LOGIC:`);
  console.log(`Total Predictions: ${withoutH2H.total}`);
  console.log(`Wins: ${withoutH2H.won}`);
  console.log(`Win Rate: ${((withoutH2H.won / Math.max(1, withoutH2H.total)) * 100).toFixed(1)}%`);
  console.log("-----------------------------------------");

  process.exit(0);
}
check().catch(console.error);
