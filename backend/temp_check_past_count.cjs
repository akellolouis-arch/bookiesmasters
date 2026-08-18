const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const Fixture = mongoose.model('Fixture', new mongoose.Schema({}, { strict: false }));
    const count = await Fixture.countDocuments({
        'fixture.fixture.date': { $gte: '2026-08-01T00:00:00Z', $lte: '2026-08-11T23:59:59Z' }
    });
    console.log('Past matches count:', count);
    mongoose.connection.close();
}
run();
