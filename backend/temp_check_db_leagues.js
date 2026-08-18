import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    try {
        const db = mongoose.connection.db;
        const leaguesCol = db.collection('leagues');
        
        const count = await leaguesCol.countDocuments({ saved: true });
        console.log(`Leagues with saved: true -> ${count}`);
        
        const anyLeague = await leaguesCol.findOne({});
        console.log(`Example fields in DB directly:`, Object.keys(anyLeague));
        if (anyLeague) console.log(`saved field:`, anyLeague.saved);
        
    } catch (err) {
        console.error(err);
    }
    mongoose.connection.close();
}
run();
