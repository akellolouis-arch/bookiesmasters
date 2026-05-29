import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({path: './.env'});
mongoose.connect(process.env.MONGO_URI).then(async () => {
    const fixtures = await mongoose.model('Fixture', new mongoose.Schema({}, {strict:false}), 'fixtures').find({
        $or: [{'fixture.teams.home.id': 42}, {'fixture.teams.away.id': 42}],
        'fixture.fixture.status.short': 'FT'
    }).lean();
    console.log("Arsenal matches in DB:", fixtures.length);
    console.log("Leagues:", Array.from(new Set(fixtures.map(x => x.fixture.league.name))));
    
    const psgFixtures = await mongoose.model('Fixture', new mongoose.Schema({}, {strict:false}), 'fixtures').find({
        $or: [{'fixture.teams.home.id': 85}, {'fixture.teams.away.id': 85}],
        'fixture.fixture.status.short': 'FT'
    }).lean();
    console.log("PSG matches in DB:", psgFixtures.length);
    console.log("Leagues:", Array.from(new Set(psgFixtures.map(x => x.fixture.league.name))));

    process.exit(0);
});
