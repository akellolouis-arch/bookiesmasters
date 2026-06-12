require('dotenv').config({path: './.env'});
const mongoose = require('mongoose');
const Fixture = require('./models/Fixture.js').default;

async function checkHighH2H() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find a match from today or tomorrow that has a high H2H count
    const match = await Fixture.findOne({
        "h2h.5": { $exists: true } // Find a match where the 6th H2H item exists
    });

    if (!match) {
        console.log("Could not find any fixture with > 5 H2H games.");
    } else {
        console.log(`Found fixture: ${match.fixture.teams.home.name} vs ${match.fixture.teams.away.name}`);
        console.log(`League: ${match.fixture.league.name}`);
        console.log(`H2H games stored in DB: ${match.h2h.length}`);
    }

    process.exit(0);
}

checkHighH2H().catch(console.error);
