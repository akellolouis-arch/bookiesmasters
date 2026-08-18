const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const Fixture = mongoose.model('Fixture', new mongoose.Schema({}, { strict: false }));
    const fixtures = await Fixture.find({
        'fixture.fixture.date': { $gte: '2026-08-12T00:00:00+03:00', $lte: '2026-08-12T23:59:59+03:00' }
    });
    let tipCount = 0;
    let noneCount = 0;
    for (const f of fixtures) {
        if (f.get('predictionTip') === 'NONE') noneCount++;
        else if (f.get('predictionTip')) tipCount++;
    }
    console.log(`Tips: ${tipCount}, NONE: ${noneCount}`);
    mongoose.connection.close();
}
run();
