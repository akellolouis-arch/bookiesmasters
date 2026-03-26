import Fixture from "../models/Fixture.js";

// Fields to remove from old matches to save space
// We KEEP: fixture, goals, score, league, teams, status
// We FLUSH: heavy arrays/objects
const FIELDS_TO_UNSET = {
    lineups: 1,
    statistics: 1,
    events: 1,
    odds: 1,
    injuries: 1,
    prediction: 1,
    h2h: 1,
    comparison: 1,
    "fixture.events": 1  // Also clear nested events in the API object if possible? 
    // Note: 'fixture' is the main object. We usually want to keep basic info. 
    // But fixture.events can be huge. Let's start with the top-level enriched fields first.
};

export async function cleanupOldFixtures() {
    try {
        console.log("🧹 [Cleanup] Starting database cleanup for matches > 7 days old...");

        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        // Find count first
        const count = await Fixture.countDocuments({
            "fixture.fixture.date": { $lt: twoDaysAgo.toISOString() },
            "cleanupDone": { $ne: true } // Avoid reprocessing
        });

        if (count === 0) {
            console.log("   ✅ No old fixtures to clean.");
            return;
        }

        console.log(`   🛁 scrubbing ${count} old matches to 'Lite Mode'...`);

        const result = await Fixture.updateMany(
            {
                "fixture.fixture.date": { $lt: twoDaysAgo.toISOString() },
                "cleanupDone": { $ne: true }
            },
            {
                $unset: FIELDS_TO_UNSET,
                $set: { cleanupDone: true }
            }
        );

        console.log(`   ✨ Cleanup complete. Modified ${result.modifiedCount} documents.`);

    } catch (err) {
        console.error("❌ [Cleanup] Error:", err.message);
    }
}
