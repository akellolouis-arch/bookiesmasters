require('dotenv').config({ path: '.env' });
const { MongoClient } = require('mongodb');
const axios = require('axios');
const fs = require('fs');

const KENYA_TZ = "Africa/Nairobi";
const kenyaYmdFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: KENYA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

function getKenyaDatePlus(offsetDays) {
    const todayYmd = kenyaYmdFormatter.format(new Date());
    const [y, m, d] = todayYmd.split("-").map(Number);
    const base = new Date(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T00:00:00+03:00`);
    const target = new Date(base.getTime() + offsetDays * 86400000);
    return kenyaYmdFormatter.format(target);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
    const uri = process.env.MONGO_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('test');
        const leaguesCollection = db.collection('leagues');
        const fixturesCollection = db.collection('fixtures');

        const savedLeagues = await leaguesCollection.find({}).toArray();
        const savedIds = savedLeagues.map(l => l.league.id);

        console.log(`\n⏳ Fetching intense VIP data for Days -3, -4, and -5...`);

        const targetDates = [getKenyaDatePlus(-3), getKenyaDatePlus(-4), getKenyaDatePlus(-5)];

        for (const date of targetDates) {
            console.log(`\n📅 Downloading match schedule for ${date}...`);

            const res = await axios.get('https://v3.football.api-sports.io/fixtures', {
                headers: { 'x-apisports-key': process.env.API_KEY },
                params: { date }
            });

            const dayFixtures = res.data.response || [];
            const vipFixtures = dayFixtures.filter(f => savedIds.includes(f.league.id));

            console.log(`   Found ${vipFixtures.length} VIP matches on this date.`);

            for (const f of vipFixtures) {
                const fixtureId = f.fixture.id;
                console.log(`   → Fixture ${fixtureId} (${f.teams.home.name} vs ${f.teams.away.name})`);

                // Fetch Prediction
                let prediction = null;
                let h2h = null;
                try {
                    const pRes = await axios.get('https://v3.football.api-sports.io/predictions', {
                        headers: { 'x-apisports-key': process.env.API_KEY },
                        params: { fixture: fixtureId }
                    });
                    const pData = pRes.data?.response?.[0];
                    if (pData) {
                        prediction = pData.predictions;
                        h2h = pData.h2h;
                    }
                } catch (e) { }
                await sleep(500);

                // Fetch Odds (1xBet)
                let bets = [];
                try {
                    const oRes = await axios.get('https://v3.football.api-sports.io/odds', {
                        headers: { 'x-apisports-key': process.env.API_KEY },
                        params: { fixture: fixtureId, bookmaker: 11 }
                    });
                    const oddsData = oRes.data?.response?.[0];
                    if (oddsData && oddsData.bookmakers) {
                        bets = oddsData.bookmakers.map(b => ({
                            bookmaker: b.name,
                            markets: b.bets.filter(m => m.id === 1 || m.name.toLowerCase() === "match winner").map(m => ({
                                id: m.id,
                                name: m.name,
                                values: m.values
                            }))
                        }));
                    }
                } catch (e) { }
                await sleep(500);

                // Upsert
                await fixturesCollection.updateOne(
                    { fixtureId: fixtureId },
                    {
                        $set: {
                            fixtureId: fixtureId,
                            fixture: f,
                            prediction: prediction,
                            h2h: h2h,
                            odds: bets,
                            cleanupDone: true // keep it safe
                        }
                    },
                    { upsert: true }
                );
            }
        }

        console.log(`\n🎉 Backfill Complete! Deleting self...`);
        fs.unlinkSync(__filename);

    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await client.close();
    }
}

main();
