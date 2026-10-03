import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import mongoose from "mongoose";
import User from "@/backend/models/User";
import PaymentRequest from "@/backend/models/PaymentRequest";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
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

    const customerEmail = (session?.user?.email || tx.customer?.email || "").toLowerCase().trim();
    if (!customerEmail) {
      return NextResponse.json({ error: "No customer email found for transaction" }, { status: 400 });
    }

    const amount = tx.amount ? tx.amount / 100 : 2500;
    const currency = tx.currency || "KES";
    const paidAt = tx.paid_at ? new Date(tx.paid_at) : new Date();
    const authInfo = tx.authorization || {};
    const country = authInfo.country_code || null;
    const bank = authInfo.bank || null;
    const brand = authInfo.brand || null;
    const channel = tx.channel || "card";

    // Find or create user
    let user = await User.findOne({ email: customerEmail });

    // Calculate new VIP Expiry (+7 days from now or extend existing active pass)
    const now = new Date();
    let newExpiry = new Date();
    if (user?.vipExpiry && new Date(user.vipExpiry) > now) {
      newExpiry = new Date(new Date(user.vipExpiry).getTime() + 7 * 24 * 60 * 60 * 1000);
    } else {
      newExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    if (user) {
      user.vipExpiry = newExpiry;
      user.isVip = true;
      await user.save();
    } else {
      const fullName = session?.user?.name || `${tx.customer?.first_name || ""} ${tx.customer?.last_name || ""}`.trim();
      user = await User.create({
        email: customerEmail,
        name: fullName || customerEmail,
        role: "user",
        isVip: true,
        vipExpiry: newExpiry,
      });
    }

    // Save Payment Request record
    if (existingPayment) {
      existingPayment.status = "approved";
      existingPayment.amount = amount;
      existingPayment.currency = currency;
      existingPayment.country = country;
      existingPayment.bank = bank;
      existingPayment.brand = brand;
      existingPayment.channel = channel;
      existingPayment.paidAt = paidAt;
      await existingPayment.save();
    } else {
      await PaymentRequest.create({
        userEmail: customerEmail,
        userName: user.name || session?.user?.name || "Customer",
        paymentMethod: "paystack",
        reference: reference,
        status: "approved",
        amount: amount,
        currency: currency,
        country: country,
        bank: bank,
        brand: brand,
        channel: channel,
        paidAt: paidAt,
      });
    }

    return NextResponse.json({ success: true, newExpiry }, { status: 200 });
  } catch (error: any) {
    console.error("Paystack Verification Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process payment" }, { status: 500 });
  }
}
