import mongoose from "mongoose";

const transferCacheSchema = new mongoose.Schema({
    teamId: { type: Number, required: true, unique: true },
    lastUpdated: { type: Date, default: Date.now },
    transfers: [
        {
            date: String,
            type: String, // "Free", "€ 12M", etc.
            teams: {
                in: {
                    id: Number,
                    name: String,
                    logo: String
                },
                out: {
                    id: Number,
                    name: String,
                    logo: String
                }
            },
            player: {
                id: Number,
                name: String
            }
        }
    ]
});

// Prevent overwrite
const TransferCache = mongoose.models.TransferCache || mongoose.model("TransferCache", transferCacheSchema);

export default TransferCache;
