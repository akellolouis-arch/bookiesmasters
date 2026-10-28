import { NextResponse } from "next/server";
import { getFixtureById } from "@/backend/services/fixtureService";
import dbConnect from "@/lib/mongoose";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: "Fixture ID is required" }, { status: 400 });
        }

        await dbConnect();
        const details = await getFixtureById(id);

        if (!details) {
            return NextResponse.json({ error: "Fixture not found" }, { status: 404 });
        }

        return NextResponse.json(
            { success: true, data: details },
            {
                headers: {
                    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
                },
            }
        );
    } catch (error) {
        console.error("Error in /api/fixtures/[id]:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

