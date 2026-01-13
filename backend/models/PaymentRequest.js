import mongoose from "mongoose";

const PaymentRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true }, // Redundant but useful for quick search
    amount: { type: Number, required: true },
    mpesaCode: { type: String, required: true, unique: true, uppercase: true },
    fixtureId: { type: String }, // NEW: Specific game ID
    type: { type: String, default: 'tip' }, // 'tip' or 'credits'
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    adminNote: String,
    date: { type: Date, default: Date.now }
});

export default mongoose.models.PaymentRequest || mongoose.model("PaymentRequest", PaymentRequestSchema);

// Ensure index on mpesaCode for fast lookup and uniqueness
// PaymentRequestSchema.index({ mpesaCode: 1 }, { unique: true });
