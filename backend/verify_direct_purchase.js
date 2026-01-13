import axios from "axios";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/User.js";

dotenv.config({ path: "backend/.env" });

const BASE_URL = "http://localhost:5005"; // Use temp server port

async function verifyDirectUnlock() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({});
        if (!user) {
            console.log("❌ No user found");
            process.exit(1);
        }

        console.log(`👤 Testing with user: ${user.email}`);

        const testCode = `TIP${Date.now()}`;
        const fixtureId = "123456"; // Dummy Fixture Key

        // 1. Submit Request for specific fixture
        console.log(`1️⃣ Submitting Request for Fixture ${fixtureId}...`);
        const reqRes = await axios.post(`${BASE_URL}/api/payment/request`, {
            email: user.email,
            amount: 500,
            mpesaCode: testCode,
            fixtureId: fixtureId
        });
        console.log("Submit Response:", reqRes.data);

        // 2. Find Pending
        const listRes = await axios.get(`${BASE_URL}/api/payment/admin/requests`);
        const myRequest = listRes.data.find(r => r.mpesaCode === testCode);

        if (!myRequest) throw new Error("Request not found");
        console.log(`✅ Found pending request: ${myRequest._id}`);

        // 3. Approve
        console.log("3️⃣ Approving...");
        await axios.post(`${BASE_URL}/api/payment/admin/approve`, {
            requestId: myRequest._id
        });

        // 4. Verify User Unlocked Tips
        const updatedUser = await User.findOne({ email: user.email });
        console.log("🔓 Unlocked Tips:", updatedUser.unlockedTips);

        if (updatedUser.unlockedTips.includes(fixtureId)) {
            console.log("✅ SUCCESS: Fixture ID is in unlockedTips!");
        } else {
            console.log("❌ FAILURE: Fixture ID NOT found in unlockedTips");
        }

        mongoose.disconnect();

    } catch (err) {
        console.error("❌ Error:", err.message);
        if (err.response) console.error("Data:", err.response.data);
    }
}

verifyDirectUnlock();
