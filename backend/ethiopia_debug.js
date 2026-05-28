import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import League from "./models/League.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function checkLeague() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const ethiopianLeagues = await League.find({
            $or: [
                {"country.name": { $regex: "Ethiopia", $options: "i" }},
                {"league.name": { $regex: "Ethiopia", $options: "i" }}
            ]
        }).lean();

        console.log(`Found ${ethiopianLeagues.length} leagues for Ethiopia in the saved Leagues collection`);

        if (ethiopianLeagues.length > 0) {
            ethiopianLeagues.forEach(l => {
                console.log(`- ID: ${l.league.id}, Name: ${l.league.name}, Season: ${l.season}`);
            });
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

checkLeague();
