import mongoose from 'mongoose';

async function run() {
    await mongoose.connect('mongodb://localhost:27017/bookiesmasters');
    const Fixture = mongoose.connection.collection('fixtures');
    const matches = await Fixture.find({ date: { $regex: '^2026-06-15' } }).toArray();
    
    const tanzania = matches.filter(m => JSON.stringify(m).toLowerCase().includes('tanzania'));
    console.log('Tanzania matches today:', tanzania.length);
    tanzania.forEach(m => {
        console.log(m.fixture.id, m.teams.home.name, 'vs', m.teams.away.name, 'Status:', m.fixture.status.short, 'Score:', m.score.fulltime);
    });
    process.exit(0);
}

run().catch(console.error);
