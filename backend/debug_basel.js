import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.local'), override: true });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Fixture = mongoose.model('Fixture', new mongoose.Schema({}, { strict: false }));
  const Standings = mongoose.model('Standing', new mongoose.Schema({}, { strict: false }));

  const f = await Fixture.findOne({ 
    'fixture.fixture.date': { $regex: '2026-07-25' }, 
    'fixture.teams.home.name': { $regex: 'Basel', $options: 'i' } 
  }).lean();
  
  if(!f) { 
    console.log('Fixture not found'); 
  } else {
    console.log('League:', f.fixture.league.name, f.fixture.league.id, f.fixture.league.season);
    const s = await Standings.find({ leagueId: f.fixture.league.id, season: f.fixture.league.season }).lean();
    console.log('Standings count for league/season:', s.length);
  }
  process.exit(0);
}
run();
