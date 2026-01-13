import express from "express";
import { submitPaymentRequest, getPendingRequests, approvePayment, rejectPayment } from "../controllers/paymentController.js";

const router = express.Router();

// Public (User)
router.post("/request", submitPaymentRequest);

// Secured (Admin) - In prod add middleware
router.get("/admin/requests", getPendingRequests);
router.post("/admin/approve", approvePayment);
router.post("/admin/reject", rejectPayment);

export default router;
