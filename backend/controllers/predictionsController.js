import { getPredictedFixturesGroupedByLeague } from "../services/fixtureCardService.js";
import { getTopTrends } from "../services/fixtureService.js";

export async function fetchPredictedFixtureCardsByDate(req, res) {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: "Date parameter is required (YYYY-MM-DD)" });
    }

    const fixtures = await getPredictedFixturesGroupedByLeague(date);

    // Calculate total leagues for statistics/meta
    const totalLeagues = fixtures.length;

    res.json({
      date,
      totalLeagues,
      fixtures
    });
  } catch (err) {
    console.error("❌ Error fetching predicted fixture cards:", err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function fetchTopTrends(req, res) {
  try {
    const trends = await getTopTrends();
    res.json({
      success: true,
      count: trends.length,
      data: trends
    });
  } catch (err) {
    console.error("❌ Error fetching top trends:", err);
    res.status(500).json({ error: "Server error" });
  }
}

