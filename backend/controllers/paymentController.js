import PaymentRequest from "../models/PaymentRequest.js";
import User from "../models/User.js";

// User submits a payment request for a specific Tip
export const submitPaymentRequest = async (req, res) => {
    try {
        const { email, amount, mpesaCode, fixtureId } = req.body;

        if (!email || !amount || !mpesaCode) {
            console.log("Missing fields in body:", req.body);
            return res.status(400).json({ error: "All fields are required" });
        }
        console.log("DEBUG: Received Payment Body:", JSON.stringify(req.body));

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        // Check if code already used
        const existing = await PaymentRequest.findOne({ mpesaCode: mpesaCode.toUpperCase() });
        if (existing) {
            return res.status(400).json({ error: "This transaction code has already been submitted." });
        }

        const request = new PaymentRequest({
            userId: user._id,
            email: user.email,
            amount: Number(amount),
            mpesaCode: mpesaCode.toUpperCase(),
            fixtureId: fixtureId || null // Optional if buying bulk credits, but main flow is Tip
        });

        await request.save();

        console.log(`💸 Payment Request: ${mpesaCode} for Fixture ${fixtureId || 'General'}`);
        res.json({ success: true, message: "Payment submitted. Wait for approval." });

    } catch (err) {
        console.error("Payment Request Error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

// Admin lists pending requests
export const getPendingRequests = async (req, res) => {
    try {
        const requests = await PaymentRequest.find({ status: "pending" }).sort({ date: -1 });
        res.json(requests);
    } catch (err) {
        console.error("Get Pendings Error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

// Admin approves a request -> Unlocks Tip
export const approvePayment = async (req, res) => {
    try {
        const { requestId } = req.body;

        const request = await PaymentRequest.findById(requestId);
        if (!request) return res.status(404).json({ error: "Request not found" });

        if (request.status === "approved") {
            return res.status(400).json({ error: "Already approved" });
        }

        const user = await User.findById(request.userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Approve
        request.status = "approved";
        await request.save();

        // NEW LOGIC: Unlock specific tip if fixtureId is present
        if (request.fixtureId) {
            if (!user.unlockedTips.includes(request.fixtureId)) {
                user.unlockedTips.push(request.fixtureId);
            }
            console.log(`🔓 Unlocked Fixture ${request.fixtureId} for ${user.email}`);
        } else {
            console.log("⚠️ Approved payment without specific fixture ID (Legacy/General donation?)");
        }

        user.purchaseHistory.push({
            amount: request.amount, // KSH Paid
            cost: request.amount,
            providerRef: request.mpesaCode,
            provider: 'manual_mpesa_tip'
        });

        await user.save();

        res.json({ success: true, message: "Payment Approved & Tip Unlocked" });

    } catch (err) {
        console.error("Approve Error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

// Admin rejects a request
export const rejectPayment = async (req, res) => {
    try {
        const { requestId, reason } = req.body;
        const request = await PaymentRequest.findById(requestId);
        if (!request) return res.status(404).json({ error: "Request not found" });

        request.status = "rejected";
        request.adminNote = reason;
        await request.save();

        res.json({ success: true, message: "Request rejected" });
    } catch (err) {
        console.error("Reject Error:", err);
        res.status(500).json({ error: "Server error" });
    }
};
