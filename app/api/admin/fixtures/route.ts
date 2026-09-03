import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import mongoose from "mongoose";
import Fixture from "@/backend/models/Fixture";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    // @ts-ignore
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const query = searchParams.get("q") || "";

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI || "");
    }

    const startOfDay = new Date(`${dateParam}T00:00:00+03:00`);
    const endOfDay = new Date(`${dateParam}T23:59:59.999+03:00`);

    const filter: any = {
      "fixture.fixture.date": {
        $gte: startOfDay.toISOString(),
        $lte: endOfDay.toISOString()
      }
    };

    if (query.trim()) {
      const regex = new RegExp(query.trim(), "i");
      filter.$or = [
        { "fixture.teams.home.name": regex },
        { "fixture.teams.away.name": regex },
        { "fixture.league.name": regex }
      ];
    }

    const fixtures = await Fixture.find(filter)
      .sort({ "fixture.fixture.date": 1 })
      .lean();

    return NextResponse.json({ fixtures });
  } catch (err: any) {
    console.error("Admin Fixtures GET Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    // @ts-ignore
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { fixtureId, customPredictionTip, customOdds, isAdminPick } = body;

    if (!fixtureId) {
      return NextResponse.json({ error: "fixtureId is required" }, { status: 400 });
    }

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI || "");
    }

    const update: any = {
      isAdminPick: isAdminPick !== undefined ? isAdminPick : true,
      updatedAt: new Date()
    };

    if (customPredictionTip !== undefined) {
      update.customPredictionTip = customPredictionTip;
    }
    if (customOdds !== undefined) {
      update.customOdds = customOdds;
    }

    const updated = await Fixture.findOneAndUpdate(
      { fixtureId: Number(fixtureId) },
      { $set: update },
      { new: true }
    );

    return NextResponse.json({ success: true, fixture: updated });
  } catch (err: any) {
    console.error("Admin Fixtures PUT Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
