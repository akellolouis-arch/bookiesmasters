import mongoose from 'mongoose';
import dotenv from 'dotenv';
import League from './models/League.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    try {
        const leagues = await League.find({});
        console.log(`Total leagues: ${leagues.length}`);
        if (leagues.length > 0) {
            console.log(`Example fields: ${Object.keys(leagues[0].toObject())}`);
            console.log(`saved: ${leagues[0].get("saved")}`);
        }
    } catch (err) {
        console.error(err);
    }
    mongoose.connection.close();
}
run();
