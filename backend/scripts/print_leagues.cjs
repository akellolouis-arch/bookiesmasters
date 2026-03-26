require('dotenv').config({ path: '.env' });
const { MongoClient } = require('mongodb');

async function main() {
    const uri = process.env.MONGO_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('test');
        const leaguesCollection = db.collection('leagues');

        const allLeagues = await leaguesCollection.find({}).toArray();

        console.log(`CURRENTLY SAVED LEAGUES (${allLeagues.length}):\n`);

        allLeagues.forEach((l, index) => {
            console.log(`${index + 1}. ID: ${l.league.id} | ${l.league.name} (${l.country.name})`);
        });

    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await client.close();
    }
}

main();
