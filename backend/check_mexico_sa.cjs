require('dotenv').config({path: './.env'});
const mongoose = require('mongoose');
const Fixture = require('./models/Fixture.js').default;

async function checkFixture() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find fixture with Mexico and South Africa
    const match = await Fixture.findOne({
        $or: [
            { "fixture.teams.home.name": /Mexico/i, "fixture.teams.away.name": /South Africa/i },
            { "fixture.teams.home.name": /South Africa/i, "fixture.teams.away.name": /Mexico/i }
        ]
    });

    if (!match) {
        console.log("Could not find Mexico vs South Africa fixture in the database.");
    } else {
        console.log(`Found fixture: ${match.fixture.teams.home.name} vs ${match.fixture.teams.away.name}`);
        console.log(`Fixture ID: ${match.fixtureId}`);
        console.log(`Date: ${match.fixture.fixture.date}`);
        console.log(`H2H games stored in DB: ${match.h2h ? match.h2h.length : 0}`);
    }

    process.exit(0);
}

checkFixture().catch(console.error);
