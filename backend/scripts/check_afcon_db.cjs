require('dotenv').config({ path: '.env' });
const { MongoClient } = require('mongodb');

async function main() {
    const uri = process.env.MONGO_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const database = client.db('test'); // default is test, wait, Mongoose uses the URI database name. URI has `/?appName=fixtures`. We should probably check `bookiesmasters` database.
        // Wait, the previous summary said: "Database: MongoDB (bookiesmasters database)."
        const db = client.db('bookiesmasters');
        const leaguesCollection = db.collection('leagues');

        const league36 = await leaguesCollection.findOne({ "league.id": 36 });

        if (league36) {
            console.log("League ID 36 (Africa Cup of Nations - Qualification) IS in the database.");
        } else {
            console.log("League ID 36 IS MISSING from the database.");
        }

    } finally {
        await client.close();
    }
}

main().catch(console.error);
