import mongoose from "mongoose";

const PremiumTipSchema = new mongoose.Schema({
  homeTeam: { type: String, required: true },
  awayTeam: { type: String, required: true },
  league: { type: String, required: true },
  country: { type: String, required: true },
  matchDate: { type: Date, required: true },
  prediction: { type: String, required: true },
  odds: { type: String, required: true },
  score: { type: String, default: "" },
  status: { type: String, enum: ['pending', 'won', 'lost'], default: 'pending' }
}, { timestamps: true });

export default mongoose.models.PremiumTip || mongoose.model("PremiumTip", PremiumTipSchema);
