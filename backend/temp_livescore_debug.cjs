require('dotenv').config({path: './.env'});
const mongoose = require('mongoose');
const Fixture = require('./models/Fixture.js').default;

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const now = new Date();
    const fiveMinsFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    console.log("Checking activeOrImpendingMatches for 1517790...");
    const activeOrImpendingMatches = await Fixture.find({
        $or: [
            { "fixture.fixture.status.short": { $in: ["1H","HT","2H","ET","BT","P","LIVE","INT"] } },
            {
                "fixture.fixture.status.short": "NS",
                "fixture.fixture.date": { $lte: fiveMinsFromNow.toISOString() }
            }
        ]
    }).select("fixtureId fixture.teams fixture.fixture.date fixture.fixture.status.short").lean();

    const m = activeOrImpendingMatches.find(x => x.fixtureId === 1517790);
    if(m) {
        console.log("YES! 1517790 is in activeOrImpendingMatches!");
        console.log(m);
    } else {
        console.log("NO! 1517790 is NOT in activeOrImpendingMatches!");
    }
    
    process.exit(0);
});
