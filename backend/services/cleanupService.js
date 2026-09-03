import Fixture from "../models/Fixture.js";

// Fields to remove from old matches to save space
// We KEEP: fixture, goals, score, league, teams, status
// We FLUSH: heavy arrays/objects
const FIELDS_TO_UNSET_7_DAYS = {
    lineups: 1,
    statistics: 1,
    events: 1,
    odds: 1,
    injuries: 1,
    h2h: 1,
    comparison: 1,
    "fixture.events": 1
};

export async function cleanupOldFixtures() {
    try {
        console.log("🧹 [Cleanup] Starting database cleanup pipeline...");

        const now = new Date();

        // 1. DELETE FIXTURES OLDER THAN 1.5 YEARS (547 DAYS)
        const eighteenMonthsAgo = new Date(now.getTime() - 547 * 86400000);
        const deletedResult = await Fixture.deleteMany({
            "fixture.fixture.date": { $lt: eighteenMonthsAgo.toISOString() }
        });
        if (deletedResult.deletedCount > 0) {
            console.log(`   🗑️ Permanently deleted ${deletedResult.deletedCount} fixtures older than 1.5 years (${eighteenMonthsAgo.toISOString().split('T')[0]}).`);
        } else {
            console.log("   ✅ No fixtures older than 1.5 years to delete.");
        }

        // 2. UNSET PREDICTION TIPS FOR MATCHES OLDER THAN 8 DAYS
        const eightDaysAgo = new Date(now.getTime() - 8 * 86400000);
        const predResult = await Fixture.updateMany(
            {
                "fixture.fixture.date": { $lt: eightDaysAgo.toISOString() },
                predictionTip: { $exists: true }
            },
            {
                $unset: { predictionTip: 1, prediction: 1 }
            }
        );
        if (predResult.modifiedCount > 0) {
            console.log(`   🏷️ Removed prediction tips from ${predResult.modifiedCount} matches older than 8 days.`);
        }

        // 3. SCRUB HEAVY FIELDS FOR MATCHES OLDER THAN 7 DAYS (LITE MODE)
        const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
        const count = await Fixture.countDocuments({
            "fixture.fixture.date": { $lt: sevenDaysAgo.toISOString() },
            "cleanupDone": { $ne: true }
        });

        if (count > 0) {
            console.log(`   洗 Scrubbing ${count} matches > 7 days old to Lite Mode...`);
            const scrubResult = await Fixture.updateMany(
                {
                    "fixture.fixture.date": { $lt: sevenDaysAgo.toISOString() },
                    "cleanupDone": { $ne: true }
                },
                {
                    $unset: FIELDS_TO_UNSET_7_DAYS,
                    $set: { cleanupDone: true }
                }
            );
            console.log(`   ✨ Scrubbed ${scrubResult.modifiedCount} documents.`);
        } else {
            console.log("   ✅ No new 7-day-old fixtures to scrub.");
        }

    } catch (err) {
        console.error("❌ [Cleanup] Error:", err.message);
    }
}
