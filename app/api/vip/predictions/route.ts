import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Fixture from "@/backend/models/Fixture";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date") || new Date().toISOString().split("T")[0];

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI || "");
    }

    const startOfDay = new Date(`${dateParam}T00:00:00+03:00`);
    const endOfDay = new Date(`${dateParam}T23:59:59.999+03:00`);

    // Fetch fixtures where admin has set a pick (isAdminPick: true or customPredictionTip exists)
    const fixtures = await Fixture.find({
      "fixture.fixture.date": {
        $gte: startOfDay.toISOString(),
        $lte: endOfDay.toISOString()
      },
      $or: [
        { isAdminPick: true },
        { customPredictionTip: { $exists: true, $ne: "" } }
      ]
    })
      .sort({ "fixture.fixture.date": 1 })
      .lean();

    return NextResponse.json({ fixtures });
  } catch (err: any) {
    console.error("VIP Predictions GET Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
