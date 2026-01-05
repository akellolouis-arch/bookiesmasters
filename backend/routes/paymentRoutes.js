import express from "express";
import { initializePayment, handlePaystackWebhook } from "../controllers/paymentController.js";

const router = express.Router();

// Route to start payment (Protected in frontend, but public endpoint here)
router.post("/initialize", initializePayment);

// Webhook endpoint (Public, called by Paystack)
router.post("/webhook", handlePaystackWebhook);

export default router;
