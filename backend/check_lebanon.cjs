const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Fixture = require('./models/Fixture');

async function checkLebanon() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ MongoDB connected");

        const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
        console.log("Searching for fixtures on:", today);

        const fixtures = await Fixture.find({ 
            date: { $regex: `^${today}` } 
        });

        const lebanonGame = fixtures.find(f => 
            f.league.name.toLowerCase().includes("lebanon") || 
            f.league.country.toLowerCase().includes("lebanon") ||
            f.homeTeam.name.toLowerCase().includes("lebanon") ||
            f.awayTeam.name.toLowerCase().includes("lebanon")
        );

        if (lebanonGame) {
            console.log("\nFound Lebanon game!");
            console.log("Fixture ID:", lebanonGame.fixtureId);
            console.log("League:", lebanonGame.league.name, "in", lebanonGame.league.country);
            console.log("Match:", lebanonGame.homeTeam.name, "vs", lebanonGame.awayTeam.name);
            console.log("Status:", lebanonGame.fixture.status);
            console.log("Date:", lebanonGame.date);
            console.log("Score:", lebanonGame.score);
            console.log("Last updated in DB:", lebanonGame.updatedAt);
            
            // Check the live update flag if it exists
            console.log("Is Live tracking enabled?", lebanonGame.isLive || (["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"].includes(lebanonGame.fixture.status.short)));
            
            // Let's fetch the actual data from the API to see if it's different
            const axios = require('axios');
            try {
                console.log("\nFetching fresh data from API-Football for fixture", lebanonGame.fixtureId);
                const response = await axios.get(`https://v3.football.api-sports.io/fixtures?id=${lebanonGame.fixtureId}`, {
                    headers: {
                        'x-rapidapi-host': 'v3.football.api-sports.io',
                        'x-rapidapi-key': process.env.API_SPORTS_KEY
                    }
                });
                const apiData = response.data.response[0];
                if (apiData) {
                    console.log("API Status:", apiData.fixture.status);
                    console.log("API Score:", apiData.score);
                } else {
                    console.log("No data returned from API for this fixture.");
                }
            } catch (err) {
                console.log("API Fetch Error:", err.message);
            }
            
        } else {
            console.log("\nNo Lebanon game found for today.");
            // Print out all matches today just to see if we missed it
            console.log("Total matches today:", fixtures.length);
        }

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
}

checkLebanon();
