require('./backend/node_modules/dotenv').config({ path: './backend/.env' });
const mongoose = require('./backend/node_modules/mongoose');
const Fixture = require('./backend/models/Fixture').default;

async function debugFixture() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Search for specific teams with CORRECT PATH
        console.log('\n--- Searching for USA vs Paraguay ---');
        const specific = await Fixture.find({
            $or: [
                { 'fixture.teams.home.name': { $regex: 'USA', $options: 'i' } },
                { 'fixture.teams.away.name': { $regex: 'USA', $options: 'i' } },
                { 'fixture.teams.home.name': { $regex: 'Paraguay', $options: 'i' } },
                { 'fixture.teams.away.name': { $regex: 'Paraguay', $options: 'i' } }
            ]
        }).sort({ 'fixture.fixture.date': -1 }).limit(5);

        specific.forEach(f => {
             const home = f.fixture?.teams?.home?.name;
             const away = f.fixture?.teams?.away?.name;
             const date = f.fixture?.fixture?.date;
             
             console.log(`\n[FOUND] ${home} vs ${away}`);
             console.log(`Date: ${date}`);
             console.log(`Status: ${f.fixture?.fixture?.status?.long} (${f.fixture?.fixture?.status?.short})`);
             
             console.log(`PREDICTION FIELD:`);
             console.log(JSON.stringify(f.prediction, null, 2));
             console.log('-------------------------');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

debugFixture();
