import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Fixture from "./models/Fixture.js";
import { getMongoClientOptions } from "./mongoConnectOptions.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

console.log("Keys in env:", Object.keys(process.env).filter(k => k.toLowerCase().includes("key") || k.toLowerCase().includes("api")));
