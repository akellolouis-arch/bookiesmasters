import { NextResponse } from 'next/server';
import { getLiveFixturesGroupedByLeague } from '@/backend/services/fixtureCardService';
import dbConnect from '@/lib/mongoose';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    const fixtures = await getLiveFixturesGroupedByLeague({ allFixtures: true });

    return NextResponse.json({
      fixtures
    });
  } catch (error) {
    console.error("Error fetching live fixture cards:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
