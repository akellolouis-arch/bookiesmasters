import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Fixture from './models/Fixture.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local'), override: true });

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

async function testUSA() {
    try {
        const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters";
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB\n');

        const futureFixtures = await Fixture.find({
            "fixture.teams.home.name": "USA",
            "fixture.teams.away.name": "Paraguay"
        }).sort({ "fixture.fixture.date": -1 }).limit(1);

        for (const doc of futureFixtures) {
            console.log(`[TESTING] ${doc.fixture.teams.home.name} vs ${doc.fixture.teams.away.name}`);
            console.log(`predictionTip in DB: ${doc.predictionTip}`);
            console.log(`dbPrediction in DB: ${doc.dbPrediction}`);
            
            const matchDate = doc.fixture.fixture.date;
            const homeId = doc.fixture.teams.home.id;
            const awayId = doc.fixture.teams.away.id;

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

            console.log("HomeStats:", homeStats);
            console.log("AwayStats:", awayStats);
            console.log("H2HStats:", h2hStats);

            let tip = "NONE";
            if (homeStats.total >= 4 && awayStats.total >= 4) {
                const homePassOV15 = homeStats.over15 >= 4;
                const awayPassOV15 = awayStats.over15 >= 4;
                const h2hPassOV15 = h2hStats.total > 0 ? (h2hStats.over15 / h2hStats.total) >= 0.6 : true;
                
                const homePassUN35 = homeStats.under35 >= 4;
                const awayPassUN35 = awayStats.under35 >= 4;
                const h2hPassUN35 = h2hStats.total > 0 ? (h2hStats.under35 / h2hStats.total) >= 0.6 : true;

                const passOV15 = homePassOV15 && awayPassOV15 && h2hPassOV15;
                const passUN35 = homePassUN35 && awayPassUN35 && h2hPassUN35;
                
                if (passOV15 || passUN35) {
                    tip = passOV15 ? "OV1.5" : "UN3.5";
                }
            }
            console.log(`Resulting TIP: ${tip}`);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}
testUSA();
