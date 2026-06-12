require('dotenv').config({path: './.env'});
const mongoose = require('mongoose');
const Fixture = require('./models/Fixture.js').default;
const axios = require('axios');

async function checkFixture() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find fixture with Baranovichi and FC Minsk
    const match = await Fixture.findOne({
        $or: [
            { "fixture.teams.home.name": /Baranovichi/i, "fixture.teams.away.name": /Minsk/i },
            { "fixture.teams.home.name": /Minsk/i, "fixture.teams.away.name": /Baranovichi/i }
        ]
    });

    if (!match) {
        console.log("Could not find Baranovichi vs Minsk fixture in the database.");
    } else {
        const homeId = match.fixture.teams.home.id;
        const awayId = match.fixture.teams.away.id;
        
        console.log(`Found fixture: ${match.fixture.teams.home.name} vs ${match.fixture.teams.away.name}`);
        console.log(`Team IDs: ${homeId} - ${awayId}`);
        console.log(`H2H games stored in DB: ${match.h2h ? match.h2h.length : 0}`);
        
        console.log(`\nFetching directly from API: https://v3.football.api-sports.io/fixtures/headtohead?h2h=${homeId}-${awayId}`);
        try {
            const response = await axios.get('https://v3.football.api-sports.io/fixtures/headtohead', {
                headers: { 'x-apisports-key': process.env.API_KEY },
                params: { h2h: `${homeId}-${awayId}` }
            });
            const apiH2H = response.data.response || [];
            console.log(`H2H games returned from API: ${apiH2H.length}`);
        } catch (e) {
            console.error("API error:", e.message);
        }
    }

    process.exit(0);
}

checkFixture().catch(console.error);
