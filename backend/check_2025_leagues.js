import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import League from "./models/League.js";
import Fixture from "./models/Fixture.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function checkIncomplete2025Leagues() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const leagues2025 = await League.find({ season: 2025 }).lean();
        console.log(`Found ${leagues2025.length} leagues with season 2025`);

        let count = 0;
        const incompleteLeagues = [];

        for (const l of leagues2025) {
            const fc = await Fixture.countDocuments({
                'fixture.league.id': l.league.id,
                'fixture.league.season': 2025
            });

            // If a league has less than 60 fixtures in a season, it's likely incomplete
            // Or if we want to be more accurate, we check if they have 0 FT matches
            if (fc > 0 && fc < 100) {
                const ftCount = await Fixture.countDocuments({
                    'fixture.league.id': l.league.id,
                    'fixture.league.season': 2025,
                    'fixture.fixture.status.short': { $in: ['FT', 'AET', 'PEN'] }
                });

                if (ftCount < 20) {
                     console.log(`- ${l.league.name} (${l.league.id}) has ${fc} total fixtures and ${ftCount} FT fixtures.`);
                     incompleteLeagues.push(l.league.id);
                     count++;
                }
            }
        }

        console.log(`\nTotal incomplete leagues found: ${count}`);
        console.log(`League IDs: ${incompleteLeagues.join(", ")}`);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

checkIncomplete2025Leagues();
