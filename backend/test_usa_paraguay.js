require('dotenv').config();
const mongoose = require('mongoose');
const Fixture = require('./models/Fixture').default;
const { generateCustomBinaryPrediction } = require('./helpers/dbPredictionEngine');

async function testUSA() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find the specific fixture for USA vs Paraguay
        const f = await Fixture.findOne({
            'fixture.teams.home.name': 'USA',
            'fixture.teams.away.name': 'Paraguay'
        }).sort({ 'fixture.fixture.date': -1 });

        if (!f) {
            console.log('Match not found');
            return;
        }

        console.log(`\n[FOUND] ${f.fixture.teams.home.name} vs ${f.fixture.teams.away.name}`);
        console.log(`Date: ${f.fixture.fixture.date}`);
        console.log(`Prediction in DB: ${f.prediction}`);
        
        // Let's get the past matches for both teams
        const homeTeamId = f.fixture.teams.home.id;
        const awayTeamId = f.fixture.teams.away.id;
        const matchDate = new Date(f.fixture.fixture.date);

        const pastHomeMatches = await Fixture.find({
            $or: [
                { 'fixture.teams.home.id': homeTeamId },
                { 'fixture.teams.away.id': homeTeamId }
            ],
            'fixture.fixture.date': { $lt: matchDate.toISOString() },
            'fixture.fixture.status.short': 'FT'
        }).sort({ 'fixture.fixture.date': -1 }).limit(10);

        const pastAwayMatches = await Fixture.find({
            $or: [
                { 'fixture.teams.home.id': awayTeamId },
                { 'fixture.teams.away.id': awayTeamId }
            ],
            'fixture.fixture.date': { $lt: matchDate.toISOString() },
            'fixture.fixture.status.short': 'FT'
        }).sort({ 'fixture.fixture.date': -1 }).limit(10);

        console.log(`Found ${pastHomeMatches.length} past matches for Home (${f.fixture.teams.home.name})`);
        console.log(`Found ${pastAwayMatches.length} past matches for Away (${f.fixture.teams.away.name})`);

        // Test the logic
        const prediction = generateCustomBinaryPrediction(pastHomeMatches, pastAwayMatches);
        console.log(`Recalculated Prediction: ${prediction}`);

        // Output some details about the recent matches to understand the logic
        function logMatches(name, matches) {
            console.log(`\n--- ${name} Matches ---`);
            let ov15 = 0;
            let un25 = 0;
            matches.forEach(m => {
                const goals = (m.fixture.goals.home || 0) + (m.fixture.goals.away || 0);
                if (goals >= 2) ov15++;
                if (goals <= 2) un25++;
                console.log(`${m.fixture.fixture.date.substring(0,10)}: ${m.fixture.teams.home.name} ${m.fixture.goals.home} - ${m.fixture.goals.away} ${m.fixture.teams.away.name} (Goals: ${goals})`);
            });
            console.log(`OV1.5: ${ov15}/${matches.length}, UN2.5: ${un25}/${matches.length}`);
        }
        
        logMatches('Home', pastHomeMatches);
        logMatches('Away', pastAwayMatches);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

testUSA();
