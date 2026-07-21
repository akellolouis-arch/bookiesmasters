import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import mongoose from "mongoose";
import PremiumTip from "@/backend/models/PremiumTip";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    // @ts-ignore
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI || "");
    }

    const { id } = await params;
    await PremiumTip.findByIdAndDelete(id);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete tip" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    // @ts-ignore
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI || "");
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!['pending', 'won', 'lost'].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updatedTip = await PremiumTip.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedTip) {
      return NextResponse.json({ error: "Tip not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, tip: updatedTip });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update tip status" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    // @ts-ignore
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI || "");
    }

    const { id } = await params;
    const body = await req.json();
    const { homeTeam, awayTeam, country, league, matchDate, prediction, odds } = body;

    // Validate date
    let dateObj;
    try {
      dateObj = new Date(matchDate);
      if (isNaN(dateObj.getTime())) throw new Error();
    } catch {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    const updatedTip = await PremiumTip.findByIdAndUpdate(
      id,
      { homeTeam, awayTeam, country, league, matchDate: dateObj, prediction, odds },
      { new: true }
    );

    if (!updatedTip) {
      return NextResponse.json({ error: "Tip not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, tip: updatedTip });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to edit tip" }, { status: 500 });
  }
}
