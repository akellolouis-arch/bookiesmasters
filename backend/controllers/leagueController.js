import League from "../models/League.js";

import Standing from "../models/Standing.js";
import { getLeagueFixtures } from "../services/fixtureCardService.js";

// GET /api/leagues/:id/fixtures
export async function getFixtures(req, res) {
  try {
    const { id } = req.params;
    const fixtures = await getLeagueFixtures(id);
    res.json({ success: true, data: fixtures });
  } catch (err) {
    console.error("❌ Error fetching league fixtures:", err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function getLeagues(req, res) {
  try {
    const leagues = await League.find({}, { "league.name": 1, "league.id": 1, _id: 0 }).lean();
    res.json({ total: leagues.length, leagues });
  } catch (err) {
    console.error("❌ Error fetching leagues:", err);
    res.status(500).json({ error: "Server error" });
  }
}



// GET /api/leagues/:id/standings
export async function getStandings(req, res) {
  try {
    const { id } = req.params;
    // We might want to filter by season if we had it in query, but taking latest is safe for now
    const standing = await Standing.findOne({ "league.id": Number(id) }).sort({ updatedAt: -1 });

    if (!standing) {
      return res.status(404).json({ success: false, message: "No standings found." });
    }

    res.json({ success: true, data: standing });
  } catch (err) {
    console.error("❌ Error fetching standings:", err);
    res.status(500).json({ error: "Server error" });
  }
}
