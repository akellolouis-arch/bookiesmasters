import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import mongoose from "mongoose";
import User from "@/backend/models/User";
import PaymentRequest from "@/backend/models/PaymentRequest";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    const secret = process.env.PAYSTACK_SECRET_KEY;

    if (!secret || !signature) {
      return NextResponse.json({ error: "Missing secret or signature" }, { status: 400 });
    }

    // Verify HMAC SHA512 signature
    const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
    if (hash !== signature) {
      console.error("Paystack webhook signature mismatch");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === "charge.success") {
      const data = event.data;
      const reference = data.reference;
      const customerEmail = data.customer?.email?.toLowerCase()?.trim();
      const amount = data.amount ? data.amount / 100 : 2500;
      const currency = data.currency || "KES";
      const paidAt = data.paid_at ? new Date(data.paid_at) : new Date();

      const authorization = data.authorization || {};
      const country = authorization.country_code || null;
      const bank = authorization.bank || null;
      const brand = authorization.brand || null;
      const channel = data.channel || "card";

      if (!customerEmail) {
        console.warn("Paystack charge.success without customer email, reference:", reference);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGO_URI || "");
      }

      // Check if already processed
      const existingPayment = await PaymentRequest.findOne({ reference });
      if (existingPayment && existingPayment.status === "approved") {
        return NextResponse.json({ message: "Already processed" }, { status: 200 });
      }

      // Find user by email
      let user = await User.findOne({ email: customerEmail });

      // Calculate new VIP expiry: 7 days added (from existing expiry if still valid, or from now)
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
        // Create user record if not yet registered
        const fullName = `${data.customer?.first_name || ""} ${data.customer?.last_name || ""}`.trim();
        user = await User.create({
          email: customerEmail,
          name: fullName || customerEmail,
          role: "user",
          isVip: true,
          vipExpiry: newExpiry,
        });
      }

      // Record or update PaymentRequest
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
          userName: user.name || "Customer",
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

      console.log(`[Paystack Webhook] VIP Activated for ${customerEmail} until ${newExpiry.toISOString()} (Ref: ${reference})`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error("Paystack Webhook Handler Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

