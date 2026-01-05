import axios from "axios";
import crypto from "crypto";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Initialize a Payment
export const initializePayment = async (req, res) => {
    try {
        const { email, amount, plan } = req.body;

        // Validate request
        if (!email || !amount) {
            return res.status(400).json({ success: false, message: "Email and amount are required" });
        }

        // Call Paystack API
        const response = await axios.post(
            "https://api.paystack.co/transaction/initialize",
            {
                email,
                amount: amount * 100, // Paystack takes kobo (multiply by 100)
                callback_url: `${process.env.CLIENT_URL}/payment/callback`, // Frontend callback
                metadata: {
                    plan_type: plan || "monthly_vip",
                    custom_filters: {
                        recurring: true
                    }
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        return res.status(200).json({
            success: true,
            authorization_url: response.data.data.authorization_url,
            access_code: response.data.data.access_code,
            reference: response.data.data.reference,
        });
    } catch (error) {
        console.error("Paystack Initialize Error:", error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: "Payment initialization failed",
            error: error.response?.data?.message || error.message,
        });
    }
};

// Handle Webhook
export const handlePaystackWebhook = async (req, res) => {
    try {
        // 1. Verify Signature
        const hash = crypto
            .createHmac("sha512", PAYSTACK_SECRET_KEY)
            .update(JSON.stringify(req.body))
            .digest("hex");

        if (hash !== req.headers["x-paystack-signature"]) {
            return res.status(400).send("Invalid Signature");
        }

        // 2. Retrieve the Event
        const event = req.body;
        console.log("🔔 Paystack Webhook Event:", event.event);

        if (event.event === "charge.success") {
            const { customer, authorization, metadata } = event.data;
            const email = customer.email;

            // 3. Update User
            const user = await User.findOne({ email });
            if (user) {
                // Calculate Expiry (e.g., 30 days from now)
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 30);

                user.isVip = true;
                user.vipExpiry = expiryDate;
                user.paystackCustomerCode = customer.customer_code;
                user.paystackAuthCode = authorization.authorization_code; // Save for recurring

                await user.save();
                console.log(`✅ User ${email} upgraded to VIP until ${expiryDate}`);
            } else {
                console.error(`❌ User not found for email: ${email}`);
            }
        }

        return res.sendStatus(200);
    } catch (error) {
        console.error("Webhook Error:", error.message);
        return res.sendStatus(500);
    }
};
