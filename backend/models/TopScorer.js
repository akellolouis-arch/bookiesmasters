import mongoose from "mongoose";

const TopScorerSchema = new mongoose.Schema(
    {
        leagueId: { type: Number, required: true },
        season: { type: Number, required: true },
        scorers: { type: Array, default: [] },
        lastUpdated: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

TopScorerSchema.index({ leagueId: 1, season: 1 }, { unique: true });

export default mongoose.models.TopScorer || mongoose.model("TopScorer", TopScorerSchema);

