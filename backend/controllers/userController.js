import User from "../models/User.js";

export const getBalance = async (req, res) => {
    try {
        const { email } = req.query; // Simple auth for now since we trust the session email from frontend
        if (!email) return res.status(400).json({ error: "Email query required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        // Lazy Expiry Check
        if (user.credits > 0 && user.creditsExpiry && new Date() > new Date(user.creditsExpiry)) {
            console.log(`🕒 Credits expired for ${email}. Resetting to 0.`);
            user.credits = 0;
            user.save(); // Async save, don't await to block response significantly
        }

        res.json({ credits: user.credits });
    } catch (err) {
        console.error("Get Balance Error:", err);
        res.status(500).json({ error: "Server error" });
    }
};
