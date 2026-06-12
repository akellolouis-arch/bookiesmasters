require('dotenv').config({path: './.env'});
const mongoose = require('mongoose');
const Fixture = require('./models/Fixture.js').default;
const axios = require('axios');

async function checkApi() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const doc = await Fixture.findOne({
        "fixture.teams.home.name": /Singida Black Stars/i,
        "fixture.teams.away.name": /Tanzania Prisons/i
    });

    if (!doc) {
        console.log("Match not found.");
        process.exit(0);
    }

    const fixtureId = doc.fixtureId;
    console.log(`Found Match! Fixture ID: ${fixtureId}`);

    try {
        const res = await axios.get(`https://v3.football.api-sports.io/fixtures?id=${fixtureId}`, {
            headers: { "x-apisports-key": process.env.API_KEY }
        });
        
        const data = res.data.response[0];
        console.log("API STATUS:", data.fixture.status);
        console.log("API GOALS:", data.goals);
        console.log("API SCORE:", data.score);
    } catch (e) {
        console.error("API Fetch Error:", e.message);
    }

    process.exit(0);
}

checkApi().catch(e => { console.error(e); process.exit(1); });
