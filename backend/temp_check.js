import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Fixture from "./models/Fixture.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const ft2025 = await Fixture.countDocuments({
        'fixture.league.id': 311, 
        'fixture.league.season': 2025,
        'fixture.fixture.status.short': {$in: ['FT', 'AET', 'PEN']}
    });
    console.log(`Albania 311 FT fixtures 2025: ${ft2025}`);
    process.exit(0);
}
check();
