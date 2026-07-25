const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env.local' });
mongoose.connect(process.env.MONGO_URI).then(async () => {
    const start = new Date('2026-07-24T00:00:00+03:00');
    const end = new Date('2026-07-25T23:59:59+03:00');
    const fixtures = await mongoose.connection.collection('fixtures').find({
        'fixture.fixture.date': { $gte: start.toISOString(), $lte: end.toISOString() }
    }).toArray();
    
    const counts = {};
    for (const f of fixtures) {
        const tip = f.predictionTip;
        counts[tip] = (counts[tip] || 0) + 1;
    }
    console.log("Prediction tip counts for Today and Tomorrow:");
    console.log(counts);
    process.exit(0);
}).catch(console.error);
