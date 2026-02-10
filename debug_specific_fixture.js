require('./backend/node_modules/dotenv').config({ path: './backend/.env' });
const mongoose = require('./backend/node_modules/mongoose');
const Fixture = require('./backend/models/Fixture').default;

async function debugFixture() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Search for specific teams with CORRECT PATH
        console.log('\n--- Searching for Bishop/Harborough with nested path ---');
        const specific = await Fixture.find({
            $or: [
                { 'fixture.teams.home.name': { $regex: 'Bishop', $options: 'i' } },
                { 'fixture.teams.away.name': { $regex: 'Bishop', $options: 'i' } },
                { 'fixture.teams.home.name': { $regex: 'Harborough', $options: 'i' } },
                { 'fixture.teams.away.name': { $regex: 'Harborough', $options: 'i' } }
            ]
        }).limit(5);

        specific.forEach(f => {
             const home = f.fixture?.teams?.home?.name;
             const away = f.fixture?.teams?.away?.name;
             const date = f.fixture?.fixture?.date;
             
             console.log(`\n[FOUND] ${home} vs ${away}`);
             console.log(`Date: ${date}`);
             console.log(`Status: ${f.fixture?.fixture?.status?.long} (${f.fixture?.fixture?.status?.short})`);
             console.log(`Elapsed: ${f.fixture?.fixture?.status?.elapsed}`);
             console.log(`Timestamp: ${f.fixture?.fixture?.timestamp}`);
             
             console.log(`LIVESCORE FIELD:`);
             console.log(JSON.stringify(f.livescore, null, 2));
             console.log('-------------------------');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

debugFixture();
