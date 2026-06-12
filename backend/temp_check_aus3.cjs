require('dotenv').config({path: './.env'});
const mongoose = require('mongoose');
const Fixture = require('./models/Fixture.js').default;
const { formatFixtureCard } = require('./helpers/fixtureFormatter.js');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const start = new Date('2026-06-12T00:00:00+03:00').toISOString();
    const end = new Date('2026-06-12T23:59:59.999+03:00').toISOString();
    const fixtures = await Fixture.aggregate([
        { $match: { 'fixture.fixture.date': { $gte: start, $lte: end }, 'fixture.league.country': /Australia/i } },
        {
          $project: {
            fixtureId: 1,
            "fixture.id": 1,
            "fixture.name": 1,
            "fixture.logo": 1,
            "fixture.country": 1,
            "fixture.fixture": 1,
            "fixture.league": 1,
            "fixture.teams": 1,
            "fixture.goals": 1,
            "fixture.score": 1,
            "fixture.status": 1,
            "livescore": 1,
          }
        }
    ]);
    
    console.log("Aggregated matches:", fixtures.length);
    fixtures.forEach(f => {
        try {
            formatFixtureCard(f);
        } catch (err) {
            console.error("Format error for fixture:", f.fixtureId, err.message);
        }
    });
    process.exit(0);
});
