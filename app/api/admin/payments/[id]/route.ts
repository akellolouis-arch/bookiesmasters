import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import mongoose from "mongoose";
import PaymentRequest from "@/backend/models/PaymentRequest";
import User from "@/backend/models/User";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    // @ts-ignore
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await req.json(); // 'approve' or 'reject'
    const paymentId = params.id;

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI || "");
    }

    const payment = await PaymentRequest.findById(paymentId);
    if (!payment) {
      return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
    }

    if (action === 'approve') {
      // Find user by email
      const user = await User.findOne({ email: payment.userEmail });
      if (!user) {
        return NextResponse.json({ error: "Associated user not found in database" }, { status: 404 });
      }

      // Add 7 days to expiry (from now if expired, or from current expiry if active)
      const now = new Date();
      let newExpiry = new Date();
      if (user.vipExpiry && new Date(user.vipExpiry) > now) {
        newExpiry = new Date(new Date(user.vipExpiry).getTime() + 7 * 24 * 60 * 60 * 1000);
      } else {
        newExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      }

      user.vipExpiry = newExpiry;
      await user.save();

      payment.status = "approved";
      await payment.save();

      return NextResponse.json({ success: true, newExpiry });

    } else if (action === 'reject') {
      payment.status = "rejected";
      await payment.save();
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Admin Payment Action Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process payment" }, { status: 500 });
  }
}
