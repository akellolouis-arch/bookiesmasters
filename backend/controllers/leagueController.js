import { getLeagueDetails } from "../services/leagueService.js";

export const getLeagueDetailsController = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: "League ID is required" });
        }

        const details = await getLeagueDetails(id);
        if (!details) {
            return res.status(404).json({ success: false, message: "League not found" });
        }

        res.status(200).json({ success: true, data: details });
    } catch (error) {
        console.error("Error in getLeagueDetailsController:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
