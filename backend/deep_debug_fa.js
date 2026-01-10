import mongoose from "mongoose";
import dotenv from "dotenv";
import Fixture from "./models/Fixture.js";

dotenv.config({ path: "backend/.env" }); // Explicitly load backend .env
dotenv.config(); // Fallback

const FA_CUP_ID = 45; // Based on previous context

async function debugFaCup() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ DB Connected");

        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        console.log(`📅 Checking fixtures for Today: ${startOfDay.toISOString()}`);

        const fixtures = await Fixture.find({
            "fixture.league.id": FA_CUP_ID,
            "fixture.fixture.date": { $gte: startOfDay.toISOString(), $lte: endOfDay.toISOString() }
            // Note: API saves date as string usually, so regex or string compare might be needed if not cast to Date in schema.
            // Let's use the same regex approach as enrichment if needed, or date query if schema handles it.
            // But let's check broadly first.
        }).limit(5).lean();

        console.log(`🔎 Found ${fixtures.length} FA Cup fixtures for today.`);

        fixtures.forEach(f => {
            console.log(`\n⚽ Match: ${f.fixture.teams.home.name} vs ${f.fixture.teams.away.name}`);
            console.log(`   ID: ${f.fixture.id}`);

            if (!f.odds || f.odds.length === 0) {
                console.log("   ❌ No Odds Array");
            } else {
                const mkts = f.odds[0].markets;
                if (!mkts || mkts.length === 0) {
                    console.log("   ❌ Odds Array exists but Markets Empty");
                } else {
                    console.log(`   ✅ Odds Found: ${mkts.length} markets.`);
                    console.log(`      Sample: ${mkts[0].name} (ID: ${mkts[0].id})`);
                }
            }
        });

        if (fixtures.length === 0) {
            // Check broadly if ANY FA cup fixtures exist recently
            const anyFix = await Fixture.find({ "league.id": FA_CUP_ID }).sort({ "fixture.date": -1 }).limit(1);
            if (anyFix.length > 0) {
                console.log(`\nℹ️ Latest FA Cup fixture found is on date: ${anyFix[0].fixture.date}`);
            } else {
                console.log("\n⚠️ No FA Cup fixtures found in DB at all.");
            }
        }

        mongoose.disconnect();

    } catch (err) {
        console.error("Error:", err);
    }
}

debugFaCup();
