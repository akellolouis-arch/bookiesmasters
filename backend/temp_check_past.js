import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Fixture from './models/Fixture.js';
import { getPredictedFixturesGroupedByLeague, clearPredictionCache } from './services/fixtureCardService.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Pick the first fixture from Aug 12
    const doc = await Fixture.findOne({ 
        'fixture.fixture.date': { $gte: '2026-08-12T00:00:00+03:00', $lte: '2026-08-12T23:59:59+03:00' },
        'fixture.league.name': { $not: /friendlies/i }
    });
    
    const matchDate = doc.fixture.fixture.date;
    const homeId = doc.fixture.teams.home.id;
    const awayId = doc.fixture.teams.away.id;
    const leagueId = doc.fixture.league.id;

    console.log(`Checking matchDate: ${matchDate}, league: ${leagueId}, home: ${homeId}, away: ${awayId}`);
    
    const homeMatchesLeague = await Fixture.find({
        "fixture.league.id": leagueId,
        $or: [{ "fixture.teams.home.id": homeId }, { "fixture.teams.away.id": homeId }],
        "fixture.fixture.date": { $lt: matchDate },
        "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
    }).sort({ "fixture.fixture.date": -1 }).limit(5);
    
    console.log(`Found ${homeMatchesLeague.length} past matches for home team.`);
    
    mongoose.connection.close();
}

run();
