import { NextResponse } from 'next/server';
import { getFixturesGroupedByLeague } from '@/backend/services/fixtureCardService';
import dbConnect from '@/lib/mongoose';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });

    await dbConnect();

    const fixtures = await getFixturesGroupedByLeague(date);

    return NextResponse.json({
      date,
      fixtures
    });
  } catch (error) {
    console.error("Error fetching fixture cards:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
