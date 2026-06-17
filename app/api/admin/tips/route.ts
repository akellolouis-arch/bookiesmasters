import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import mongoose from "mongoose";
import PremiumTip from "@/backend/models/PremiumTip";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    // @ts-ignore
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || "");
    }

    const newTip = await PremiumTip.create(body);
    return NextResponse.json({ success: true, tip: newTip });

  } catch (error: any) {
    console.error("Add Tip Error:", error);
    return NextResponse.json({ error: error.message || "Failed to add tip" }, { status: 500 });
  }
}
