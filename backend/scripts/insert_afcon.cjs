require('dotenv').config({ path: '.env' });
const { MongoClient } = require('mongodb');
const axios = require('axios');

async function main() {
    const uri = process.env.MONGO_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('test');
        const leaguesCollection = db.collection('leagues');

        const leagueId = 36;

        // Fetch full league data from API to insert properly
        console.log(`Fetching data for League ID ${leagueId} from API...`);
        const response = await axios.get(`https://v3.football.api-sports.io/leagues`, {
            headers: { 'x-apisports-key': process.env.API_KEY },
            params: { id: leagueId }
        });

        const leagueData = response.data.response[0];
        if (!leagueData) {
            console.error("League not found in API.");
            return;
        }

        // Check if already exists just in case
        const existing = await leaguesCollection.findOne({ "league.id": leagueId });
        if (existing) {
            console.log(`League ${leagueId} already exists in DB.`);
        } else {
            console.log(`Inserting League ${leagueId} into DB...`);
            await leaguesCollection.insertOne(leagueData);
            console.log("Successfully inserted!");
        }

    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await client.close();
    }
}

main();
