import express from "express";
import { getBalance } from "../controllers/userController.js";
import { spinWheel, getSpinStatus } from "../controllers/gamificationController.js";

const router = express.Router();

router.get("/balance", getBalance);
router.post("/spin", spinWheel);
router.get("/spin/status", getSpinStatus);

export default router;
