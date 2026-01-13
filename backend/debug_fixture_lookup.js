import mongoose from "mongoose";
import dotenv from "dotenv";
import Fixture from "./models/Fixture.js";

dotenv.config({ path: "./backend/.env" });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const id = 1490803;
        console.log(`Searching for ID: ${id}`);

        // Try finding by root fixtureId
        const doc1 = await Fixture.findOne({ fixtureId: id });
        console.log("Found by root fixtureId?", !!doc1);

        // Try finding by nested id
        const doc2 = await Fixture.findOne({ "fixture.fixture.id": id });
        console.log("Found by nested fixture.fixture.id?", !!doc2);

        if (doc1) {
            console.log("Doc1 ID type:", typeof doc1.fixtureId);
            console.log("Doc1 _id:", doc1._id);
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

run();
