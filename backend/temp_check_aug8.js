import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Fixture from './models/Fixture.js';

dotenv.config();

async function test() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find fixtures on Aug 8 that HAVE a predictionTip
    const fixtures = await Fixture.find({
        "fixture.fixture.date": { $gte: "2026-08-08T00:00:00+03:00", $lte: "2026-08-08T23:59:59+03:00" },
        predictionTip: { $exists: true, $ne: "NONE" }
    });

    console.log(`Found ${fixtures.length} fixtures with tips on Aug 8.`);
    if (fixtures.length > 0) {
        console.log(`Example tip: ${fixtures[0].predictionTip}, Fixture ID: ${fixtures[0].fixtureId}`);
        // Let's print out the exact DB document to see what's in it!
        console.log(JSON.stringify(fixtures[0].fixture.goals));
    }

    mongoose.connection.close();
}

test();
