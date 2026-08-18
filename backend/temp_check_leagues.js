import mongoose from 'mongoose';
import dotenv from 'dotenv';
import League from './models/League.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    try {
        const savedLeagues = await League.find({ saved: true });
        console.log(`Saved leagues: ${savedLeagues.length}`);
        if (savedLeagues.length > 0) {
            console.log(`Example: ${savedLeagues[0].league.name}`);
        }
    } catch (err) {
        console.error(err);
    }
    mongoose.connection.close();
}
run();
