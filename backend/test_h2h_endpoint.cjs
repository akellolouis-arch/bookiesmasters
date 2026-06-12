require('dotenv').config({path: './.env'});
const axios = require('axios');

async function testH2H() {
    try {
        // Manchester United (33) vs Newcastle (34)
        const h2hStr = "33-34";
        
        console.log(`Testing /fixtures/headtohead for ${h2hStr}...`);
        
        const response = await axios.get('https://v3.football.api-sports.io/fixtures/headtohead', {
            headers: { 'x-apisports-key': process.env.API_KEY },
            params: { h2h: h2hStr }
        });

        const fixtures = response.data.response || [];
        console.log(`\n✅ Returned ${fixtures.length} H2H matches between these two teams!`);
        
        if (fixtures.length > 0) {
            console.log("\nSample of the first 3 matches returned:");
            fixtures.slice(0, 3).forEach((f, i) => {
                const date = new Date(f.fixture.date).toLocaleDateString();
                const home = f.teams.home.name;
                const homeGoals = f.goals.home !== null ? f.goals.home : "?";
                const awayGoals = f.goals.away !== null ? f.goals.away : "?";
                const away = f.teams.away.name;
                const league = f.league.name;
                console.log(`  ${i+1}. [${date}] ${league}: ${home} ${homeGoals} - ${awayGoals} ${away}`);
            });
        }

    } catch (err) {
        console.error("Error calling API:", err.message);
    }
}

testH2H();
