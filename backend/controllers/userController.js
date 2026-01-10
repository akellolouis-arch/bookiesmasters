import User from "../models/User.js";

export const getBalance = async (req, res) => {
    try {
        const { email } = req.query; // Simple auth for now since we trust the session email from frontend
        if (!email) return res.status(400).json({ error: "Email query required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        res.json({ credits: user.credits });
    } catch (err) {
        console.error("Get Balance Error:", err);
        res.status(500).json({ error: "Server error" });
    }
};
