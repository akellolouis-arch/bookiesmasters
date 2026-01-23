
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { getTeamTransfers } from "./backend/services/transfersService.js";

// Manually read .env.local for Mongo URI
const envPath = path.resolve(".env.local");
let MONGO_URI = "";
let API_KEY = "";

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    const lines = envContent.split("\n");
    for (const line of lines) {
        if (line.startsWith("MONGO_URI=")) {
            const val = line.substring("MONGO_URI=".length).trim();
            MONGO_URI = val.replace(/^["']|["']$/g, "");
            if (MONGO_URI.includes("appName=") && !MONGO_URI.match(/appName=[^&]+/)) {
                MONGO_URI = MONGO_URI.replace(/[?&]appName=$/, "");
            }
        }
        if (line.startsWith("API_KEY=")) {
            API_KEY = line.split("=")[1].trim().replace(/^["']|["']$/g, "");
        }
    }
}

// Mock process.env for the service
process.env.API_KEY = API_KEY;

async function testService() {
    try {
        console.log("🔌 Connecting to DB...");
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });

        console.log(`🔌 Connection State: ${mongoose.connection.readyState} (1=connected)`);

        console.log("🧪 Testing getTeamTransfers for Chelsea (49)...");
        const transfers = await getTeamTransfers(49);

        console.log(`✅ Result: ${transfers.length} transfers found.`);
        if (transfers.length > 0) {
            console.log("Sample:", JSON.stringify(transfers[0], null, 2));
        } else {
            console.log("⚠️ No transfers returned. This might be due to API filtering or empty response.");
        }

    } catch (e) {
        console.error("❌ Test Failed:", e);
    } finally {
        console.log("🔌 Disconnecting...");
        await mongoose.disconnect();
    }
}

testService();
