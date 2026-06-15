import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Fixture from './models/Fixture.js';

dotenv.config();

async function queryTips() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const dates = ["2026-06-13", "2026-06-14"];

        for (const date of dates) {
            const startOfDayKenya = new Date(`${date}T00:00:00+03:00`);
            const endOfDayKenya = new Date(`${date}T23:59:59.999+03:00`);

            const fixtures = await Fixture.find({
                "fixture.fixture.date": {
                    $gte: startOfDayKenya.toISOString(),
                    $lte: endOfDayKenya.toISOString()
                },
                predictionTip: "UN2.5"
            });

            console.log(`\n--- ${date} (UN2.5 Tips: ${fixtures.length}) ---`);
            let wonCount = 0;
            
            fixtures.forEach(doc => {
                const homeGoals = doc.fixture.goals?.home ?? doc.fixture.score?.fulltime?.home;
                const awayGoals = doc.fixture.goals?.away ?? doc.fixture.score?.fulltime?.away;
                
                let resultStr = "Pending";
                let won = false;

                if (homeGoals !== undefined && awayGoals !== undefined && homeGoals !== null && awayGoals !== null) {
                    const totalGoals = homeGoals + awayGoals;
                    won = totalGoals < 2.5;
                    resultStr = `${homeGoals}-${awayGoals} (Won: ${won})`;
                    if (won) wonCount++;
                }

                console.log(`[UN2.5] ${doc.fixture.teams.home.name} vs ${doc.fixture.teams.away.name} (League: ${doc.fixture.league?.name}) | Result: ${resultStr}`);
            });
            
            if (fixtures.length > 0) {
                const finishedCount = fixtures.filter(f => f.fixture.goals?.home !== null && f.fixture.goals?.home !== undefined).length;
                if (finishedCount > 0) {
                    console.log(`Win Rate for ${date}: ${((wonCount/finishedCount)*100).toFixed(2)}% (${wonCount}/${finishedCount})`);
                }
            }
        }

        mongoose.connection.close();
    } catch (e) {
        console.error(e);
        mongoose.connection.close();
    }
}

queryTips();
