import User from "../models/User.js";

// COOLDOWN: 24 Hours in milliseconds
// const SPIN_COOLDOWN = 24 * 60 * 60 * 1000;
// COOLDOWN: 60 Minutes (1 Hour)
const SPIN_COOLDOWN = 60 * 60 * 1000;

/**
 * Prize Configuration
 * Probability is weight based.
 */
const PRIZES = [
    { label: "40 CR", value: 40, weight: 50, color: "#9ca3af" }, // Was 10
    { label: "20 CR", value: 20, weight: 30, color: "#60a5fa" },
    { label: "50 CR", value: 50, weight: 15, color: "#a855f7" },
    { label: "100 CR", value: 100, weight: 4.9, color: "#eab308" },
    { label: "30 CR", value: 30, weight: 0.1, color: "#ef4444" } // Was Jackpot (500)
];

// Helper: Pick random prize based on weights
function pickPrize() {
    const totalWeight = PRIZES.reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * totalWeight;

    for (const prize of PRIZES) {
        if (random < prize.weight) return prize;
        random -= prize.weight;
    }
    return PRIZES[0]; // Fallback
}

export const getSpinStatus = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: "Email required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        const now = new Date();
        const lastSpin = user.lastSpinTime ? new Date(user.lastSpinTime) : new Date(0);
        const diff = now - lastSpin;

        const canSpin = diff >= SPIN_COOLDOWN;
        const nextSpinTime = canSpin ? now : new Date(lastSpin.getTime() + SPIN_COOLDOWN);

        return res.json({
            canSpin,
            nextSpinTime,
            credits: user.credits
        });

    } catch (err) {
        console.error("Spin check error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export const spinWheel = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        // 1. Check Cooldown
        const now = new Date();
        const lastSpin = user.lastSpinTime ? new Date(user.lastSpinTime) : new Date(0);

        if (now - lastSpin < SPIN_COOLDOWN) {
            return res.status(400).json({
                error: "Cooldown active",
                nextSpinTime: new Date(lastSpin.getTime() + SPIN_COOLDOWN)
            });
        }

        // 2. Pick Prize
        const prize = pickPrize();

        // 3. Update User
        // If existing credits have expired, zero them out first
        if (user.creditsExpiry && now > user.creditsExpiry) {
            user.credits = 0;
        }

        user.credits += prize.value;
        user.lastSpinTime = now;
        user.creditsExpiry = new Date(now.getTime() + SPIN_COOLDOWN); // Valid for 60m

        // Log transaction (optional: recycle purchaseHistory or make new field)
        // Using purchaseHistory for audit even though it's free
        user.purchaseHistory.push({
            amount: prize.value,
            cost: 0,
            providerRef: `SPIN-${now.getTime()}`,
            provider: 'spin_wheel'
        });

        await user.save();

        console.log(`🎰 SPIN: ${email} won ${prize.value} credits! Verify expiry: ${user.creditsExpiry}`);

        return res.json({
            success: true,
            prize: prize,
            newBalance: user.credits,
            nextSpinTime: new Date(now.getTime() + SPIN_COOLDOWN)
        });

    } catch (err) {
        console.error("Spin exec error:", err);
        res.status(500).json({ error: "Server error" });
    }
};
