
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Fixture from './models/Fixture.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in .env');
    process.exit(1);
}

const explainQuery = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const date = new Date().toISOString().split('T')[0];
        const startOfDayKenya = new Date(`${date}T00:00:00+03:00`);
        const endOfDayKenya = new Date(`${date}T23:59:59.999+03:00`);

        const matchFilter = {
            "fixture.fixture.date": {
                $gte: startOfDayKenya.toISOString(),
                $lte: endOfDayKenya.toISOString()
            }
        };

        console.log(`🔎 Explaining query for date range: ${matchFilter["fixture.fixture.date"].$gte} - ${matchFilter["fixture.fixture.date"].$lte}`);

        // Construct the aggregation matching what is in the service
        const pipeline = [
            { $match: matchFilter },
            {
                $project: {
                    fixtureId: 1,
                    "fixture.id": 1,
                    // ... simulate projection ...
                }
            },
            {
                $lookup: {
                    from: "vipfixtures",
                    localField: "fixtureId",
                    foreignField: "fixtureId",
                    as: "vipData"
                }
            },
            {
                $unwind: {
                    path: "$vipData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: { "fixture.league.id": 1, "fixture.fixture.date": 1 }
            }
        ];

        // Mongoose doesn't support explain() directly on aggregate easily in all versions, 
        // but we can access the collection driver.
        const explanation = await Fixture.collection.aggregate(pipeline).explain('executionStats');

        // console.log("📊 Execution Stats:");
        console.log(JSON.stringify(explanation, null, 2));
        const stats = explanation.executionStats;
        if (stats) {
            console.log(`nReturned: ${stats.nReturned}`);
        }
        console.log(`executionTimeMillis: ${stats.executionTimeMillis}`);
        console.log(`totalKeysExamined: ${stats.totalKeysExamined}`);
        console.log(`totalDocsExamined: ${stats.totalDocsExamined}`);

        // Check finding of index
        if (explanation.queryPlanner) {
            console.log(`winningPlan inputStage:`, JSON.stringify(explanation.queryPlanner.winningPlan.inputStage || explanation.queryPlanner.winningPlan, null, 2));
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

explainQuery();
