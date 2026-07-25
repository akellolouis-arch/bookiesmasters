import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Fixture from "./models/Fixture.js";
import { getMongoClientOptions } from "./mongoConnectOptions.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.local"), override: true });

async function run() {
    await mongoose.connect(process.env.MONGO_URI, getMongoClientOptions());
    
    const docs = await Fixture.find({
        $or: [
            { "fixture.teams.home.name": { $regex: /Argentino Rosario/i } },
            { "fixture.teams.away.name": { $regex: /Argentino Rosario/i } },
            { "fixture.teams.home.name": { $regex: /Puerto Nuevo/i } },
            { "fixture.teams.away.name": { $regex: /Puerto Nuevo/i } },
        ],
        predictionTip: { $exists: true, $nin: [null, "NONE"] }
    });

    console.log(`Found ${docs.length} predicted matches for these teams:`);
    docs.forEach(doc => {
        console.log(JSON.stringify({
            fixtureId: doc.fixtureId,
            home: doc.fixture?.teams?.home?.name,
            away: doc.fixture?.teams?.away?.name,
            dateIso: doc.fixture?.fixture?.date,
            status: doc.fixture?.fixture?.status,
            livescore: doc.livescore,
            predictionTip: doc.predictionTip
        }, null, 2));
    });
    process.exit(0);
}

run();
