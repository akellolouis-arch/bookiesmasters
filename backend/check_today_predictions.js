import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Fixture from './models/Fixture.js';

dotenv.config();

const calculateWDL = (matches, teamId) => {
    let stats = { total: 0, wins: 0, draws: 0, losses: 0 };
    
    matches.forEach(m => {
        const hId = m.fixture.teams.home.id;
        const aId = m.fixture.teams.away.id;
        const hGoals = m.fixture?.goals?.home ?? m.fixture?.score?.fulltime?.home;
        const aGoals = m.fixture?.goals?.away ?? m.fixture?.score?.fulltime?.away;
        
        if (hGoals !== undefined && aGoals !== undefined && hGoals !== null && aGoals !== null) {
            stats.total++;
            const isHome = (teamId === hId);
            const teamGoals = isHome ? hGoals : aGoals;
            const oppGoals = isHome ? aGoals : hGoals;
            
            if (teamGoals > oppGoals) stats.wins++;
            else if (teamGoals < oppGoals) stats.losses++;
            else stats.draws++;
        }
    });
    return stats;
};

async function checkToday() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const date = "2026-06-15";
        const startOfDayKenya = new Date(`${date}T00:00:00+03:00`);
        const endOfDayKenya = new Date(`${date}T23:59:59.999+03:00`);

        const matchFilter = {
            "fixture.fixture.date": {
                $gte: startOfDayKenya.toISOString(),
                $lte: endOfDayKenya.toISOString()
            }
        };

        const fixtures = await Fixture.find(matchFilter);
        console.log(`Found ${fixtures.length} total fixtures for today (${date}).`);

        let homeWinTips = 0;
        let awayWinTips = 0;
        
        console.log("\n--- TODAY'S MATCHES WITH 1/2 TIPS ---");

        for (const doc of fixtures) {
            const matchDate = doc.fixture.fixture.date;
            const homeId = doc.fixture.teams.home.id;
            const awayId = doc.fixture.teams.away.id;

            const [homeMatches, awayMatches] = await Promise.all([
                Fixture.find({
                    $or: [{ "fixture.teams.home.id": homeId }, { "fixture.teams.away.id": homeId }],
                    "fixture.fixture.date": { $lt: matchDate },
                    "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
                }).sort({ "fixture.fixture.date": -1 }).limit(5),
                Fixture.find({
                    $or: [{ "fixture.teams.home.id": awayId }, { "fixture.teams.away.id": awayId }],
                    "fixture.fixture.date": { $lt: matchDate },
                    "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
                }).sort({ "fixture.fixture.date": -1 }).limit(5)
            ]);

            const homeForm = calculateWDL(homeMatches, homeId);
            const awayForm = calculateWDL(awayMatches, awayId);

            if (homeForm.total >= 4 && awayForm.total >= 4) {
                const passHomeWin = homeForm.wins >= 4 && awayForm.losses >= 4;
                const passAwayWin = awayForm.wins >= 4 && homeForm.losses >= 4;
                
                let tip = null;
                if (passHomeWin) tip = "HOME WIN";
                else if (passAwayWin) tip = "AWAY WIN";

                if (tip) {
                    if (tip === "HOME WIN") homeWinTips++;
                    if (tip === "AWAY WIN") awayWinTips++;

                    const time = new Date(matchDate).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi" });
                    console.log(`[${time}] ${tip} -> ${doc.fixture.teams.home.name} vs ${doc.fixture.teams.away.name} (League: ${doc.fixture.league?.name})`);
                }
            }
        }

        console.log("\n--- SUMMARY ---");
        console.log(`Total '1/2' Tips Today: ${homeWinTips + awayWinTips}`);
        console.log(`Home Win Tips: ${homeWinTips}`);
        console.log(`Away Win Tips: ${awayWinTips}`);

        mongoose.connection.close();
    } catch (e) {
        console.error(e);
        mongoose.connection.close();
    }
}

checkToday();
