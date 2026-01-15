
import dbConnect from './lib/mongoose';
import Fixture from './backend/models/Fixture';

async function inspectPrediction() {
    await dbConnect();
    const fixture = await Fixture.findOne({ prediction: { $ne: null } }).select('prediction').lean();
    if (fixture) {
        console.log(JSON.stringify(fixture.prediction, null, 2));
    } else {
        console.log("No fixture with prediction data found.");
    }
    process.exit(0);
}

inspectPrediction();
