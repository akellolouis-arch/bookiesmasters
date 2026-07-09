import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";
import Fixture from "./models/Fixture.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const query = {
            $or: [
                { "fixture.teams.home.name": { $regex: /Laredo/i } },
                { "fixture.teams.away.name": { $regex: /Laredo/i } },
            ]
        };

        const m = await Fixture.findOne(query).sort({ "fixture.fixture.date": -1 }).lean();
        
        if (!m) {
            console.log("Not found.");
        } else {
            fs.writeFileSync("output.json", JSON.stringify(m, null, 2));
            console.log("Saved to output.json");
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
run();
