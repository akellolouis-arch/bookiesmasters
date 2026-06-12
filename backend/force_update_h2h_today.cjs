require('dotenv').config({path: './.env'});
const mongoose = require('mongoose');
const Fixture = require('./models/Fixture.js').default;
const { fetchHeadToHead } = require('./services/fixturePredictionOddsApi.js');

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find all upcoming fixtures for today and tomorrow
    const start = new Date();
    start.setHours(0,0,0,0);
    const end = new Date(start.getTime() + 86400000 * 2);

    const fixtures = await Fixture.find({
        "fixture.fixture.date": { $gte: start.toISOString(), $lt: end.toISOString() }
    }).limit(20);

    console.log(`Forcing H2H update for ${fixtures.length} upcoming matches...`);

    for(let i=0; i<fixtures.length; i++) {
        const doc = fixtures[i];
        const homeId = doc.fixture.teams.home.id;
        const awayId = doc.fixture.teams.away.id;
        
        console.log(`Fetching H2H for ${doc.fixture.teams.home.name} vs ${doc.fixture.teams.away.name} (${homeId}-${awayId})...`);
        const newH2H = await fetchHeadToHead(homeId, awayId);
        
        await Fixture.updateOne(
            { _id: doc._id },
            { $set: { h2h: newH2H } }
        );

        // API rate limit
        await new Promise(r => setTimeout(r, 600));
    }

    console.log("✅ Done! H2H arrays overwritten with new data.");
    process.exit(0);
}

run().catch(console.error);
