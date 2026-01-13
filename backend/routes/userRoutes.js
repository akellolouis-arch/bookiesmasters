import express from "express";
import { getBalance } from "../controllers/userController.js";
const router = express.Router();

router.get("/balance", getBalance);

export default router;
