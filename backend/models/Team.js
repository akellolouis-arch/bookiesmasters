import mongoose from "mongoose";

const TeamSchema = new mongoose.Schema(
    {
        teamId: { type: Number, unique: true, required: true },
        name: { type: String, required: true },
        country: { type: String },
        city: { type: String }, // Home city
        venueName: { type: String },
        coordinates: {
            lat: { type: Number },
            lon: { type: Number },
        },
        logo: { type: String },
        lastUpdated: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Indexes
TeamSchema.index({ teamId: 1 }, { unique: true });

export default mongoose.models.Team || mongoose.model("Team", TeamSchema);
