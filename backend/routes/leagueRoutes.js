import express from "express";
import { getLeagueDetailsController } from "../controllers/leagueController.js";

const router = express.Router();

router.get("/:id", getLeagueDetailsController);

export default router;

