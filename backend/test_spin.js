import axios from "axios";
import dotenv from "dotenv";

dotenv.config({ path: "backend/.env" });
dotenv.config(); // Also try root

const BASE_URL = "http://localhost:5000"; // Assuming local backend port

async function testSpin() {
    try {
        console.log("🧪 Testing Spin API...");
        // We need a valid email in DB.
        // Let's assume there's at least one user or I can create a dummy one if needed?
        // I'll try to query logic or just pass a known email if I knew one.
        // Since I don't know a user email, I'll try to find one first via mongoose.
        // But better to integrate mongoose here to fetch a user email.

        // Wait, I can just use mongoose to find a user first.
        const mongoose = (await import("mongoose")).default;
        const User = (await import("./models/User.js")).default;

        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({});
        if (!user) {
            console.log("❌ No users found in DB to test with.");
            process.exit(0);
        }

        console.log(`👤 Testing with user: ${user.email}`);

        // 1. Check Status
        console.log("1️⃣ Checking Status...");
        const statusRes = await axios.get(`${BASE_URL}/api/user/spin/status?email=${user.email}`);
        console.log("Status Code:", statusRes.status);
        console.log("Status Data:", statusRes.data);

        // 2. Try Spin
        if (statusRes.data.canSpin) {
            console.log("2️⃣ Attempting Spin...");
            const spinRes = await axios.post(`${BASE_URL}/api/user/spin`, { email: user.email });
            console.log("Spin Code:", spinRes.status);
            console.log("Spin Data:", spinRes.data);
        } else {
            console.log("⏳ Cannot spin (Cooldown active).");
        }

        mongoose.disconnect();

    } catch (err) {
        console.error("❌ Error:", err.message);
        if (err.response) {
            console.error("Response Data:", err.response.data);
        }
    }
}

testSpin();
