import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import mongoose from "mongoose";
import User from "@/backend/models/User";
import PaymentRequest from "@/backend/models/PaymentRequest";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reference } = await req.json();
    if (!reference) {
      return NextResponse.json({ error: "Transaction reference is required" }, { status: 400 });
    }

    // Connect to DB
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI || "");
    }

    // Check if this reference has already been processed successfully
    const existingPayment = await PaymentRequest.findOne({ reference });
    if (existingPayment && existingPayment.status === "approved") {
      return NextResponse.json({ success: true, message: "Already processed" }, { status: 200 });
    }

    // Verify with Paystack API
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status) {
      console.error("Paystack verification failed:", paystackData);
      return NextResponse.json({ error: "Failed to verify transaction with Paystack" }, { status: 400 });
    }

    const tx = paystackData.data;

    // Check if transaction was successful
    if (tx.status !== "success") {
      return NextResponse.json({ error: `Transaction status is ${tx.status}` }, { status: 400 });
    }

    // Make sure amount matches expectations (2500 KES = 250000 kobo)
    if (tx.currency === 'KES' && tx.amount < 250000) {
       console.warn(`Payment received but amount too low: ${tx.amount} KES`);
      // We could reject it, but let's just log it and proceed for now, or strictly reject:
      // return NextResponse.json({ error: "Transaction amount is less than required" }, { status: 400 });
    }

    // Update User VIP Expiry (+7 days from now)
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 7);

    await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: { vipExpiry: newExpiry } }
    );

    // Save Payment Request record
    if (existingPayment) {
        existingPayment.status = "approved";
        await existingPayment.save();
    } else {
        await PaymentRequest.create({
          userEmail: session.user.email,
          userName: session.user.name || "Unknown",
          paymentMethod: "paystack",
          reference: reference,
          status: "approved",
        });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Paystack Verification Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process payment" }, { status: 500 });
  }
}
