import express from "express";
import { fetchPredictedFixtureCardsByDate, fetchTopTrends } from "../controllers/predictionsController.js";

const router = express.Router();

router.get("/cards", fetchPredictedFixtureCardsByDate);
router.get("/trends", fetchTopTrends);

export default router;

