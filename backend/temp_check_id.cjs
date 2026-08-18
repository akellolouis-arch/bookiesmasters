const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const Fixture = mongoose.model('Fixture', new mongoose.Schema({}, { strict: false }));
    const doc = await Fixture.findOne({ 'fixture.fixture.date': { $gte: '2026-08-12T00:00:00+03:00' } });
    console.log("Root fixtureId:", doc.get('fixtureId'));
    console.log("Nested fixture.id:", doc.get('fixture.id'));
    console.log("Nested fixture.fixture.id:", doc.get('fixture.fixture.id'));
    mongoose.connection.close();
}
run();
