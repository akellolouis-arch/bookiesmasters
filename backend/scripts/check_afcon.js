require('dotenv').config({ path: '../.env' });
const axios = require('axios');

async function main() {
    try {
        console.log("Searching for AFCON Qualifications...");
        const response = await axios.get('https://v3.football.api-sports.io/leagues', {
            headers: {
                'x-apisports-key': process.env.API_FOOTBALL_KEY
            },
            params: {
                search: "Africa Cup of Nations Qualification"
            }
        });

        const leagues = response.data.response;
        console.log(`Found ${leagues.length} leagues matching search.`);

        leagues.forEach(l => {
            console.log(`\nLeague ID: ${l.league.id}`);
            console.log(`Name: ${l.league.name}`);

            const currentSeason = l.seasons.find(s => s.current);
            if (currentSeason) {
                console.log(`Current Season: ${currentSeason.year}`);
                console.log(`Predictions Supported:`, currentSeason.coverage.predictions);
                console.log(`Odds Supported:`, currentSeason.coverage.odds);
                console.log(`Standings Supported:`, currentSeason.coverage.standings);
            } else {
                console.log(`No current season found.`);
            }
        });

    } catch (e) {
        console.error("Error:", e.message);
    }
}

main();
