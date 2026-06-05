import express from "express";
import { fetchPredictedFixtureCardsByDate } from "../controllers/predictionsController.js";

const router = express.Router();

router.get("/cards", fetchPredictedFixtureCardsByDate);

export default router;
