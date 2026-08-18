const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const Fixture = mongoose.model('Fixture', new mongoose.Schema({}, { strict: false }));
    await Fixture.updateMany({ 'fixture.fixture.date': { $gte: '2026-08-12T00:00:00+03:00', $lte: '2026-08-12T23:59:59+03:00' } }, { $unset: { predictionTip: 1 } });
    console.log('Unset predictionTip for Aug 12');
    mongoose.connection.close();
}
run();
