import { MongoClient } from 'mongodb';

async function run() {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const db = client.db('bookiesmasters');
    
    // Find any matches today containing "Simba" or "Singida"
    const matches = await db.collection('fixtures').find({
        date: { $regex: '^2026-06-15' },
        $or: [
            { 'teams.home.name': /simba/i },
            { 'teams.away.name': /simba/i },
            { 'teams.home.name': /singida/i },
            { 'teams.away.name': /singida/i }
        ]
    }).toArray();
    
    console.log(`Found ${matches.length} matches:`);
    matches.forEach(m => {
        console.log(`- ID: ${m.fixture.id} | ${m.teams.home.name} vs ${m.teams.away.name} | Status: ${m.fixture.status.short}`);
    });
    
    process.exit(0);
}

run().catch(console.error);
