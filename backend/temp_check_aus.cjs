require('dotenv').config({path: './.env'});
const mongoose = require('mongoose');
const Fixture = require('./models/Fixture.js').default;

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const today = new Date().toISOString().substring(0, 10); // e.g. "2026-06-12"
    
    // Find all matches from today in Australia
    const m = await Fixture.find({
        'fixture.league.country': /Australia/i,
        'fixture.fixture.date': { $regex: '^' + today }
    });
    
    console.log(`Found ${m.length} matches from Australia today.`);
    m.forEach(x => {
        console.log(`ID: ${x.fixtureId} | Date: ${x.fixture.fixture.date} | ${x.fixture.teams.home.name} vs ${x.fixture.teams.away.name} | Status: ${x.fixture.fixture.status.short} | Goals: ${JSON.stringify(x.fixture.goals)}`);
    });
    process.exit(0);
});
