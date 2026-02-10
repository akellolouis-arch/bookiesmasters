
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

        const testProjection = async (label, projection) => {
            console.log(`Testing: ${label}...`);
            console.time(label);
            const fixtures = await Fixture.aggregate([
                { $match: matchFilter },
                { $project: projection }
            ]);
            console.timeEnd(label);
            console.log(`  Count: ${fixtures.length}`);
        };

        console.log("---------------------------------------------------");
        await testProjection("1. ID Only", { fixtureId: 1 });
        await testProjection("2. ID + Fixture Object", { fixtureId: 1, "fixture.fixture": 1 });
        await testProjection("3. ID + Teams", { fixtureId: 1, "fixture.teams": 1 });
        await testProjection("4. ID + League", { fixtureId: 1, "fixture.league": 1 });
        await testProjection("5. ID + Scores/Goals", { fixtureId: 1, "fixture.goals": 1, "fixture.score": 1, "livescore": 1 });
        await testProjection("6. ID + Prediction (All)", { fixtureId: 1, "prediction": 1, "customPrediction": 1 });
        await testProjection("7. ID + Odds (Raw)", { fixtureId: 1, "odds": 1 });

        console.log("Testing Sort...");
        console.time("8. ID + Sort");
        const sorted = await Fixture.aggregate([
            { $match: matchFilter },
            { $project: { fixtureId: 1 } },
            { $sort: { "fixture.league.id": 1, "fixture.fixture.date": 1 } }
        ]);
        console.timeEnd("8. ID + Sort");

        // ...

        console.log("Testing Full Combined Pipeline...");
        console.time("9. Full Pipeline (Replicated)");
        const full = await Fixture.aggregate([
            { $match: matchFilter },
            // ⚡ OPTIMIZATION: Project ONLY what is needed EARLY to reduce memory usage during Sort/Lookup
            {
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
            { $sort: { "fixture.league.id": 1, "fixture.fixture.date": 1 } }
        ]);
        console.timeEnd("9. Full Pipeline (Replicated)");
        console.log(`  Count: ${full.length}`);

        console.log("---------------------------------------------------");

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

runBenchmark();
