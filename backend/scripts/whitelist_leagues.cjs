require('dotenv').config({ path: '.env' });
const { MongoClient } = require('mongodb');

// The ultimate VIP Whitelist of Top Global Leagues (~70 Leagues)
const VIP_LEAGUES = [
    // === INTERNATIONAL & CONTINENTAL ===
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 21, 22,
    29, 30, 31, 32, 33, 34, 36, 848, 531, 846, 732, 48, 556,

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
    144,    // Belgium (Pro League) - ID conflict check (Spain Supercopa/Belgium) API occasionally shares IDs or has moved them. Let's just include 144.
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

async function main() {
    const uri = process.env.MONGO_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('test');
        const leaguesCollection = db.collection('leagues');
        const fixturesCollection = db.collection('fixtures');

        console.log("=======================================");
        console.log("⚽ INITIATING TOP-70 LEAGUE WHITELIST ⚽");
        console.log("=======================================\n");

        // 1. Check what we are keeping
        const keptLeaguesCursor = await leaguesCollection.find({ "league.id": { $in: VIP_LEAGUES } }).toArray();
        console.log(`✅ Keeping ${keptLeaguesCursor.length} Premium Leagues:`);
        keptLeaguesCursor.forEach(l => console.log(`   - ${l.league.name} (${l.country.name})`));
        console.log("\n");

        // 2. Perform the League Deletions
        const leagueDeleteResult = await leaguesCollection.deleteMany({ "league.id": { $nin: VIP_LEAGUES } });
        console.log(`🗑️  DELETED ${leagueDeleteResult.deletedCount} low-tier/obscure leagues from the database.`);

        // 3. Perform the Fixture Deletions (Orphaned fixtures)
        const fixtureDeleteResult = await fixturesCollection.deleteMany({ "league.id": { $nin: VIP_LEAGUES } });
        console.log(`🗑️  DELETED ${fixtureDeleteResult.deletedCount} low-tier fixtures from the homepage.`);

        console.log("\n🎉 Cleanup Complete! Homepage is now strictly VIP/Premium matches.");

    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await client.close();
    }
}

main();
