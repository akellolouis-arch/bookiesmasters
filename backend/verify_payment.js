import axios from "axios";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/User.js";

dotenv.config({ path: "backend/.env" });

const BASE_URL = "http://localhost:5005";

async function verifyPaymentFlow() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({});
        if (!user) {
            console.log("❌ No user found");
            process.exit(1);
        }

        console.log(`👤 Testing with user: ${user.email}`);

        const testCode = `TEST${Date.now()}`;

        // 1. Submit Request
        console.log("1️⃣ Submitting Payment Request...");
        const reqRes = await axios.post(`${BASE_URL}/api/payment/request`, {
            email: user.email,
            amount: 100,
            mpesaCode: testCode
        });
        console.log("Submit Response:", reqRes.data);

        // 2. Admin List
        console.log("2️⃣ Admin Fetch Pending...");
        const listRes = await axios.get(`${BASE_URL}/api/payment/admin/requests`);
        const pending = listRes.data;
        const myRequest = pending.find(r => r.mpesaCode === testCode);

        if (!myRequest) {
            console.log("❌ Request not found in pending list");
            process.exit(1);
        }
        console.log(`✅ Found pending request: ${myRequest._id}`);

        // 3. Approve
        console.log("3️⃣ Approving Request...");
        const approveRes = await axios.post(`${BASE_URL}/api/payment/admin/approve`, {
            requestId: myRequest._id
        });
        console.log("Approve Response:", approveRes.data);

        if (approveRes.data.success) {
            console.log("✅ Flow verified successfully!");
        } else {
            console.log("❌ Approval failed");
        }

        mongoose.disconnect();

    } catch (err) {
        console.error("❌ Error:", err.message);
        if (err.response) console.error("Data:", err.response.data);
    }
}

verifyPaymentFlow();
