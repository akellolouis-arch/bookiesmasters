import { NextResponse } from "next/server";
import { getLeagueDetails } from "@/backend/services/leagueService";
import dbConnect from "@/lib/mongoose";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: "League ID is required" }, { status: 400 });
        }

        await dbConnect();
        const details = await getLeagueDetails(id);

        if (!details) {
            return NextResponse.json({ error: "League not found" }, { status: 404 });
        }

        return NextResponse.json(
            { success: true, data: details },
            {
                headers: {
                    "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
                },
            }
        );
    } catch (error) {
        console.error("Error in /api/leagues/[id]:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
