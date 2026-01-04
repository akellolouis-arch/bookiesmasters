import mongoose from "mongoose";

const SystemConfigSchema = new mongoose.Schema({
    key: { type: String, unique: true, required: true },
    value: { type: mongoose.Schema.Types.Mixed }, // Can store date, number, string, object
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.SystemConfig || mongoose.model("SystemConfig", SystemConfigSchema);
