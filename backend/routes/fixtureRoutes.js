// routes/fixtureRoutes.js
import express from "express";
import { fetchFixtureCardsByDate, fetchLiveFixtureCards } from "../controllers/fixtureCardController.js";

const router = express.Router();

// public endpoint for homepage cards
router.get("/cards", fetchFixtureCardsByDate);

// public endpoint for LIVE matches
router.get("/live", fetchLiveFixtureCards);

// public endpoint for fixture details
import { getFixtureDetails, overridePrediction } from "../controllers/fixtureDetailController.js";
router.get("/:id", getFixtureDetails);
router.post("/override", overridePrediction);

export default router;
