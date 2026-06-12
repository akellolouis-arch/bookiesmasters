require('dotenv').config({path: './.env'});
const mongoose = require('mongoose');
const Fixture = require('./models/Fixture.js').default;

const calculateStats = (matches, limit) => {
    const recent = matches.slice(0, limit);
    let stats = { total: 0, over25: 0, under25: 0 };
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

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const doc = await Fixture.findOne({
        "fixture.teams.home.name": /South Korea/i,
        "fixture.teams.away.name": /Czech Republic/i
    });

    if (!doc) {
        console.log("Match not found.");
        process.exit(0);
    }

    const matchDate = doc.fixture.fixture.date;
    const homeId = doc.fixture.teams.home.id;
    const awayId = doc.fixture.teams.away.id;

    console.log(`Found: ${doc.fixture.teams.home.name} vs ${doc.fixture.teams.away.name} (Date: ${matchDate})`);

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

    const homeStats = calculateStats(homeMatches, 5);
    const awayStats = calculateStats(awayMatches, 5);

    console.log(`Home Stats (South Korea): Total=${homeStats.total}, Over2.5=${homeStats.over25}, Under2.5=${homeStats.under25}`);
    console.log(`Away Stats (Czech Republic): Total=${awayStats.total}, Over2.5=${awayStats.over25}, Under2.5=${awayStats.under25}`);

    if (homeStats.total > 0 && awayStats.total > 0) {
        const passOV25 = homeStats.over25 >= homeStats.under25 && awayStats.over25 >= awayStats.under25;
        const passUN25 = homeStats.under25 >= homeStats.over25 && awayStats.under25 >= awayStats.over25;
        
        console.log(`Pass Over 2.5 Logic: ${passOV25}`);
        console.log(`Pass Under 2.5 Logic: ${passUN25}`);
        
        if (passOV25 || passUN25) {
            console.log("Prediction:", passOV25 ? "OV1.5" : "UN3.5");
        } else {
            console.log("Prediction: None (Mixed form - one team plays high-scoring games, the other plays low-scoring games).");
        }
    } else {
        console.log("Prediction: None (Missing historical data for one or both teams).");
    }

    process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
