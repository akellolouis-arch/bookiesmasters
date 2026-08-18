const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const Fixture = mongoose.model('Fixture', new mongoose.Schema({}, { strict: false }));
    const aug12 = await Fixture.find({ 
        'fixture.fixture.date': { $gte: '2026-08-12T00:00:00+03:00', $lte: '2026-08-12T23:59:59+03:00' },
        'fixture.league.name': { $not: /friendlies/i }
    });
    
    let nsCount = 0;
    let ftCount = 0;
    let otherCount = 0;
    
    for (const doc of aug12) {
        const status = doc.get('fixture.fixture.status.short');
        if (status === 'NS') nsCount++;
        else if (status === 'FT') ftCount++;
        else otherCount++;
    }
    
    console.log('Aug 12 NS:', nsCount, 'FT:', ftCount, 'Other:', otherCount);
    mongoose.connection.close();
}
run();
