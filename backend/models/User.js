import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, required: true },
    image: String,
    emailVerified: Date,

    // Custom VIP Fields
    isVip: { type: Boolean, default: false },
    vipExpiry: { type: Date },
    stripeCustomerId: { type: String },
    paystackCustomerCode: { type: String }, // For Paystack users
    paystackAuthCode: { type: String },     // For recurring charges

    // Credits System
    credits: { type: Number, default: 0 },
    unlockedTips: [{ type: String }], // Array of Fixture IDs or Tip IDs
    purchaseHistory: [{
        amount: Number, // Credits bought
        cost: Number,   // Money paid
        date: { type: Date, default: Date.now },
        providerRef: String // Paystack Reference
    }],


    // Tracking
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// If the model exists (from NextAuth Adapter potentially?), use it, otherwise create new
// Note: NextAuth Adapter uses the 'users' collection by default.
// Mongoose by default lowercases and pluralizes -> 'users'. matches perfectly.
export default mongoose.models.User || mongoose.model("User", UserSchema);
