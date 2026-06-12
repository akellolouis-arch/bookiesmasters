require('dotenv').config({path: './.env'});
const mongoose = require('mongoose');
const Fixture = require('./models/Fixture.js').default;

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const m = await Fixture.find({
        'fixture.league.country': /Tanzania/i,
        'fixture.fixture.date': { $gte: '2026-06-11T00:00:00Z', $lt: '2026-06-12T00:00:00Z' }
    });
    
    console.log(m.map(x => x.fixtureId + ' | ' + x.fixture.teams.home.name + ' vs ' + x.fixture.teams.away.name + ' | Status: ' + x.fixture.fixture.status.short + ' | Score: ' + JSON.stringify(x.fixture.score.fulltime)));
    process.exit(0);
});
