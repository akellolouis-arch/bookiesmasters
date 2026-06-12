require('dotenv').config({path: './.env'});
const mongoose = require('mongoose');
const Fixture = require('./models/Fixture.js').default;

async function checkTanzania() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Set up start and end of yesterday
    const today = new Date();
    today.setHours(0,0,0,0);
    const yesterday = new Date(today.getTime() - 86400000);

    const matches = await Fixture.find({
        "fixture.fixture.date": { $gte: yesterday.toISOString(), $lt: today.toISOString() },
        "fixture.league.country": /Tanzania/i
    });

    console.log(`Found ${matches.length} Tanzania matches from yesterday.`);

    matches.forEach(m => {
        console.log(`\nMatch: ${m.fixture.teams.home.name} vs ${m.fixture.teams.away.name}`);
        console.log(`Status: ${m.fixture.fixture.status.long} (${m.fixture.fixture.status.short})`);
        console.log(`Goals:`, m.fixture.goals);
        console.log(`Score:`, m.fixture.score.fulltime);
        console.log(`Livescore:`, m.livescore ? m.livescore : 'None');
    });

    process.exit(0);
}

checkTanzania().catch(console.error);
