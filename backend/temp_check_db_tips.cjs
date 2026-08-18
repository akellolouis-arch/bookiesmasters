const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const Fixture = mongoose.model('Fixture', new mongoose.Schema({}, { strict: false }));
    const aug12 = await Fixture.find({ 
        'fixture.fixture.date': { $gte: '2026-08-12T00:00:00+03:00', $lte: '2026-08-12T23:59:59+03:00' },
        predictionTip: { $exists: true, $ne: 'NONE' }
    });
    
    console.log('Aug 12 DB Tips:', aug12.length);

    const aug10 = await Fixture.find({ 
        'fixture.fixture.date': { $gte: '2026-08-10T00:00:00+03:00', $lte: '2026-08-10T23:59:59+03:00' },
        predictionTip: { $exists: true, $ne: 'NONE' }
    });
    
    console.log('Aug 10 DB Tips:', aug10.length);
    mongoose.connection.close();
}
run();
