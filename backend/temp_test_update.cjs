const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const Fixture = mongoose.model('Fixture', new mongoose.Schema({}, { strict: false }));
    
    // Pick one document
    const doc = await Fixture.findOne({ 'fixture.fixture.date': { $gte: '2026-08-12T00:00:00+03:00' } });
    const fId = doc.get('fixtureId');
    console.log("Updating document with fixtureId:", fId);
    
    // Try to update it using the exact same code
    const res = await Fixture.updateOne({ fixtureId: fId }, { $set: { predictionTip: "TEST_TIP" } });
    console.log("Update result:", res);
    
    // Check if it updated
    const verifyDoc = await Fixture.findOne({ fixtureId: fId });
    console.log("Verify doc predictionTip:", verifyDoc.get('predictionTip'));
    
    // Unset it again
    await Fixture.updateOne({ fixtureId: fId }, { $unset: { predictionTip: 1 } });
    
    mongoose.connection.close();
}
run();
