import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({path: './.env'});
mongoose.connect(process.env.MONGO_URI).then(async () => {
    const f = await mongoose.model('Fixture', new mongoose.Schema({}, {strict:false}), 'fixtures').findOne({ 'fixture.events': { $exists: true, $not: {$size: 0} } }).lean();
    console.log(f.fixtureId);
    process.exit(0);
});
