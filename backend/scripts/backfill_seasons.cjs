require('dotenv').config({ path: '.env' });
const { MongoClient } = require('mongodb');
const axios = require('axios');

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
    console.log("==================================================");
    console.log("📚 INITIATING 2-SEASON HISTORICAL BACKFILL 📚");
    console.log("==================================================\n");

    const uri = process.env.MONGO_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('test');
        const leaguesCollection = db.collection('leagues');
        const fixturesCollection = db.collection('fixtures');

        // 1. Fetch all currently saved VIP leagues
        const allLeagues = await leaguesCollection.find({}).toArray();
        console.log(`Found ${allLeagues.length} saved leagues in MongoDB.`);

        let apiCalls = 0;

        // 2. Loop through each league
        for (let i = 0; i < allLeagues.length; i++) {
            const leagueDoc = allLeagues[i];
            const L = leagueDoc.league;
            const SeasonsArr = leagueDoc.seasons || [];

            if (SeasonsArr.length === 0) {
                console.log(`Skipping ${L.name} - No seasons metadata available.`);
                continue;
            }

            console.log(`\n⏳ Processing [${i + 1}/${allLeagues.length}]: ${L.name} (${leagueDoc.country.name})`);

            // Sort seasons descending by year so we can reliably pick the top two
            SeasonsArr.sort((a, b) => b.year - a.year);

            // Find current, or just pick the top 2 if no current is explicitly flagged
            let currentIdx = SeasonsArr.findIndex(s => s.current);
            if (currentIdx === -1) {
                currentIdx = 0; // Default to the most recent year available
            }

            const targetSeasons = [];
            targetSeasons.push(SeasonsArr[currentIdx].year); // The current or latest season

            // Add the previous season if it exists in the array
            if (currentIdx + 1 < SeasonsArr.length) {
                targetSeasons.push(SeasonsArr[currentIdx + 1].year);
            }

            console.log(`   Target Seasons: ${targetSeasons.join(", ")}`);

            // Loop through the 2 target seasons and fetch them
            for (const year of targetSeasons) {
                // Check if we already have a substantial amount of fixtures for this league & season to skip
                const existingCount = await fixturesCollection.countDocuments({
                    "fixture.league.id": L.id,
                    "fixture.league.season": year
                });

                // If we already have more than 20 fixtures, assume it's basically loaded and skip saving quota.
                // Cupto-tournaments might have fewer than 20, but we can assume > 10 is usually skipped.
                // Actually, API-Football returns ALL matches for a season in 1 API call. Let's enforce skipping if > 25.
                if (existingCount > 25) {
                    console.log(`   ↳ Season ${year}: Already has ${existingCount} fixtures in DB. Skipping.`);
                    continue;
                }

                console.log(`   ↳ Season ${year}: Downloading from API-Football...`);

                try {
                    const response = await axios.get('https://v3.football.api-sports.io/fixtures', {
                        headers: { 'x-apisports-key': process.env.API_KEY },
                        params: { league: L.id, season: year }
                    });
                    apiCalls++;

                    const fixtures = response.data.response || [];

                    if (fixtures.length === 0) {
                        console.log(`     Data empty from API.`);
                        await sleep(500);
                        continue;
                    }

                    // Prepare Bulk Upsert payload
                    const bulkOps = fixtures.map(f => {
                        return {
                            updateOne: {
                                filter: { fixtureId: f.fixture.id },
                                update: {
                                    $set: {
                                        fixtureId: f.fixture.id,
                                        fixture: f, // the base fixture payload containing score, date, teams
                                        cleanupDone: true // so cleanupService ignores these historical deep-pasts
                                    },
                                    $setOnInsert: {
                                        prediction: null,
                                        h2h: null,
                                        odds: [],
                                        injuries: []
                                    }
                                },
                                upsert: true
                            }
                        };
                    });

                    // Execute Bulk Write
                    const bulkResult = await fixturesCollection.bulkWrite(bulkOps, { ordered: false });
                    console.log(`     Saved ${fixtures.length} matches. (Upserted: ${bulkResult.upsertedCount}, Modified: ${bulkResult.modifiedCount})`);

                } catch (err) {
                    const status = err.response ? err.response.status : '';
                    console.error(`     ❌ API Error fetching ${year}: ${status} - ${err.message}`);
                }

                // Respect API Rate limits (1-2 per second)
                await sleep(650);
            }
        }

        console.log(`\n🎉 Historical Backfill Complete! Executed ${apiCalls} total API requests.`);

    } catch (e) {
        console.error("\nSystem Error:", e.message);
    } finally {
        await client.close();
    }
}

main();
