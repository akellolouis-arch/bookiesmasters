import mongoose from "mongoose";
import dotenv from "dotenv";
import League from "../models/League.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

async function countLeagues() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const count = await League.countDocuments({});
        console.log(`LEAGUES_COUNT=${count}`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
countLeagues();
