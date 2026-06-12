require('dotenv').config({path: './.env'});
const mongoose = require('mongoose');
const Fixture = require('./models/Fixture.js').default;
const service = require('./services/fixtureCardService.js');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const f = await service.getFixturesGroupedByLeague('2026-06-12');
    const aus = f.find(l => l.country === 'Australia');
    console.log(aus ? aus.matches.length + ' matches found in getFixturesGroupedByLeague' : 'none in getFixturesGroupedByLeague');

    const start = new Date('2026-06-12T00:00:00+03:00').toISOString();
    const end = new Date('2026-06-12T23:59:59.999+03:00').toISOString();
    const count = await Fixture.countDocuments({
        'fixture.fixture.date': { $gte: start, $lte: end },
        'fixture.league.country': /Australia/i
    });
    console.log('Matches in DB for 2026-06-12:', count);
    process.exit(0);
});
