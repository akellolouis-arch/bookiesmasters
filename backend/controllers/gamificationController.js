import User from "../models/User.js";

// COOLDOWN: 24 Hours in milliseconds
// const SPIN_COOLDOWN = 24 * 60 * 60 * 1000;
const SPIN_COOLDOWN = 20 * 60 * 60 * 1000; // Let's simplify to 20h so "next day" is easier

/**
 * Prize Configuration
 * Probability is weight based.
 */
const PRIZES = [
    { label: "10 CR", value: 10, weight: 50, color: "#9ca3af" }, // Common
    { label: "20 CR", value: 20, weight: 30, color: "#60a5fa" }, // Good
    { label: "50 CR", value: 50, weight: 15, color: "#a855f7" }, // Rare
    { label: "100 CR", value: 100, weight: 4.9, color: "#eab308" }, // Epic
    { label: "JACKPOT", value: 500, weight: 0.1, color: "#ef4444" } // Legendary
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
        user.credits += prize.value;
        user.lastSpinTime = now;

        // Log transaction (optional: recycle purchaseHistory or make new field)
        // Using purchaseHistory for audit even though it's free
        user.purchaseHistory.push({
            amount: prize.value,
            cost: 0,
            providerRef: `SPIN-${now.getTime()}`,
            provider: 'spin_wheel'
        });

        await user.save();

        console.log(`🎰 SPIN: ${email} won ${prize.value} credits!`);

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
