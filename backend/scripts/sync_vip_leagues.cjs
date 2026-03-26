require('dotenv').config({ path: '.env' });
const { MongoClient } = require('mongodb');
const axios = require('axios');

// The ultimate VIP Whitelist of Top Global Leagues (~70 Leagues)
const VIP_LEAGUES = [
    // === INTERNATIONAL & CONTINENTAL ===
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 21, 22,
    29, 30, 31, 32, 33, 34, 36, 848, 531, 846, 732, 556,

    // === EUROPE: BIG FIVE + SECOND DIVISIONS & CUPS ===
    // England
    39, 40, 41, 42, 45, 48, // Premier, Champ, FA, EFL, WSL, League 1
    // Spain
    140, 141, 143, 144, // LaLiga, Segunda, Copa, Supercopa
    // Italy
    135, 136, 137, 138, // Serie A, Serie B, Coppa, Supercup
    // Germany
    78, 79, 81, 84, // Bundes, 2.Bundes, DFB, Supercup
    // France
    61, 62, 63, 65, // Ligue 1, Ligue 2, Coupe de France

    // === SECONDARY EUROPEAN GIANTS ===
    88, 73, // Netherlands (Eredivisie, KNVB)
    94, 96, // Portugal (Primeira Liga, Taca)
    203,    // Turkey (Super Lig)
    179,    // Scotland (Premiership)
    119,    // Denmark (Superliga)
    345,    // Czech (First League)
    390,    // Sweden (Allsvenskan)
    283,    // Romania (Liga I)

    // === AMERICAS ===
    253,    // USA (MLS)
    71,     // Brazil (Serie A)
    128,    // Argentina (Liga Profesional)
    262,    // Mexico (Liga MX)
    239,    // Colombia (Primera A)
    265,    // Chile (Primera Div)

    // === ASIA / MIDDLE EAST / OCEANIA ===
    98,     // Japan (J1 League)
    352, 188, // Australia (A-League)
    307,    // Saudi Arabia (Pro League)
    288     // South Africa (Premier Soccer League)
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
    const uri = process.env.MONGO_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('test');
        const leaguesCollection = db.collection('leagues');

        console.log("=======================================");
        console.log("⚽ SYNCING MISSING VIP LEAGUES ⚽");
        console.log("=======================================\n");

        // 1. Find currently saved leagues
        const existingDocs = await leaguesCollection.find({}, { projection: { "league.id": 1 } }).toArray();
        const existingIds = existingDocs.map(d => d.league.id);

        // 2. Determine what's missing
        const missingIds = VIP_LEAGUES.filter(id => !existingIds.includes(id));
        console.log(`Found ${missingIds.length} VIP leagues missing from your database.`);

        if (missingIds.length === 0) {
            console.log("Database is already perfectly synced.");
            return;
        }

        console.log("Fetching missing leagues from API-Football...");

        // 3. Fetch and insert missing leagues (respecting rate limits)
        let inserted = 0;
        for (const id of missingIds) {
            try {
                const response = await axios.get('https://v3.football.api-sports.io/leagues', {
                    headers: { 'x-apisports-key': process.env.API_KEY },
                    params: { id: id }
                });

                const data = response.data.response;
                if (data && data.length > 0) {
                    await leaguesCollection.insertOne(data[0]);
                    console.log(`   + Added: ${data[0].league.name} (${data[0].country.name})`);
                    inserted++;
                } else {
                    console.log(`   - Skipping ID ${id}: Not found in API or depreciated.`);
                }
            } catch (err) {
                console.error(`   ! Failed to fetch ID ${id}: ${err.message}`);
            }

            // Sleep 500ms between requests to avoid API rate limits
            await sleep(500);
        }

        console.log(`\n🎉 Sync Complete! Successfully injected ${inserted} premium leagues.`);

    } catch (e) {
        console.error("\nSystem Error:", e.message);
    } finally {
        await client.close();
    }
}

main();
