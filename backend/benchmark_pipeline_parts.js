
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

const runBenchmark = async () => {
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

        const projectStage = {
            $project: {
                fixtureId: 1,
                "fixture.id": 1,
                "fixture.name": 1,
                "fixture.logo": 1,
                "fixture.country": 1,
                "fixture.fixture": 1,
                "fixture.league": 1,
                "fixture.teams": 1,
                "fixture.goals": 1,
                "fixture.score": 1,
                "fixture.status": 1,
                "livescore": 1,
                "prediction": 1,
                "customPrediction": 1,
                customOdds: 1,
                odds: {
                    $map: {
                        input: { $slice: ["$odds", 1] },
                        as: "bookmaker",
                        in: {
                            id: "$$bookmaker.id",
                            name: "$$bookmaker.name",
                            logo: "$$bookmaker.logo",
                            markets: {
                                $filter: {
                                    input: "$$bookmaker.markets",
                                    as: "market",
                                    cond: {
                                        $or: [
                                            { $eq: ["$$market.name", "Match Winner"] },
                                            { $eq: ["$$market.id", 1] }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };

        console.log("---------------------------------------------------");

        console.log("Testing Project + Lookup (No Sort)...");
        console.time("Project + Lookup");
        const lookupOnly = await Fixture.aggregate([
            { $match: matchFilter },
            projectStage,
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
            }
        ]);
        console.timeEnd("Project + Lookup");
        console.log(`  Count: ${lookupOnly.length}`);

        console.log("Testing Project + Sort (No Lookup)...");
        console.time("Project + Sort");
        const sortOnly = await Fixture.aggregate([
            { $match: matchFilter },
            projectStage,
            { $sort: { "fixture.league.id": 1, "fixture.fixture.date": 1 } }
        ]);
        console.timeEnd("Project + Sort");
        console.log(`  Count: ${sortOnly.length}`);

        console.log("---------------------------------------------------");

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

runBenchmark();
