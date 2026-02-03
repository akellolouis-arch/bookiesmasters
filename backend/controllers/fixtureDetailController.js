
import { getFixtureById } from "../services/fixtureService.js";

export const getFixtureDetails = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, message: "Fixture ID is required" });
        }

        const details = await getFixtureById(id);

        if (!details) {
            return res.status(404).json({ success: false, message: "Fixture not found" });
        }

        res.status(200).json({ success: true, data: details });
    } catch (error) {
        console.error("Error in getFixtureDetails controller:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

import Fixture from "../models/Fixture.js";

// NEW: Override Prediction Endpoint
export const overridePrediction = async (req, res) => {
    try {
        const { fixtureId, prediction } = req.body;

        if (!fixtureId || !prediction) {
            return res.status(400).json({ success: false, message: "Fixture ID and Prediction are required" });
        }

        console.log(`🛠️ Overriding prediction for ${fixtureId} to "${prediction}"`);

        const updated = await Fixture.findOneAndUpdate(
            { fixtureId: Number(fixtureId) },
            { $set: { customPrediction: prediction } },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: "Fixture not found" });
        }

        res.status(200).json({ success: true, message: "Prediction overriden successfully", data: updated.customPrediction });

    } catch (error) {
        console.error("Error in overridePrediction:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
