import mongoose from "mongoose";

const VipFixtureSchema = new mongoose.Schema(
    {
        fixtureId: { type: Number, required: true, unique: true },
        prediction: { type: String, required: true },
        customOdds: { type: String, default: null }, // Store as string to preserve formatting if needed
        creditCost: { type: Number, default: 20 },
        isVip: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Index for fast lookups during aggregation
VipFixtureSchema.index({ fixtureId: 1 });

export default mongoose.models.VipFixture || mongoose.model("VipFixture", VipFixtureSchema);
