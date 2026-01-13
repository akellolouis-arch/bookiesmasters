import mongoose from "mongoose";
import dotenv from "dotenv";
import PaymentRequest from "./models/PaymentRequest.js";
import User from "./models/User.js";

dotenv.config({ path: "backend/.env" });

async function checkLastRequest() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("🔍 Checking last PaymentRequest...");
        const request = await PaymentRequest.findOne().sort({ date: -1 });

        if (!request) {
            console.log("❌ No requests found.");
        } else {
            console.log("📄 Request Found:");
            console.log(JSON.stringify(request.toObject(), null, 2));

            console.log(`\n🧩 Checking User ${request.email}...`);
            const user = await User.findOne({ email: request.email });
            console.log("🔓 User Unlocked Tips:", user.unlockedTips);
        }

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkLastRequest();
