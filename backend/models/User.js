import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, required: true },
    image: String,
    emailVerified: Date,

    // Custom VIP Fields (Simplified)
    isVip: { type: Boolean, default: false },
    vipExpiry: { type: Date },

    // Unlocked Content
    unlockedTips: [{ type: String }], // Array of Fixture IDs

    // Transaction History
    purchaseHistory: [{
        amount: Number, // KSH Paid
        date: { type: Date, default: Date.now },
        providerRef: String, // Transaction Code
        provider: { type: String, default: 'mpesa' }
    }],


    // Tracking
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// If the model exists (from NextAuth Adapter potentially?), use it, otherwise create new
// Note: NextAuth Adapter uses the 'users' collection by default.
// Mongoose by default lowercases and pluralizes -> 'users'. matches perfectly.
export default mongoose.models.User || mongoose.model("User", UserSchema);
