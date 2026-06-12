require('dotenv').config({path: './.env'});
const axios = require('axios');

async function checkApi() {
    const fixtureId = 1541432;
    console.log(`Checking Fixture ID: ${fixtureId}`);

    try {
        const res = await axios.get(`https://v3.football.api-sports.io/fixtures?id=${fixtureId}`, {
            headers: { "x-apisports-key": process.env.API_KEY }
        });
        
        const data = res.data.response[0];
        if (!data) {
            console.log("No data returned from API.");
            process.exit(0);
        }
        console.log("API STATUS:", data.fixture.status);
        console.log("API GOALS:", data.goals);
        console.log("API SCORE:", data.score);
    } catch (e) {
        console.error("API Fetch Error:", e.message);
    }

    process.exit(0);
}

checkApi().catch(e => { console.error(e); process.exit(1); });
