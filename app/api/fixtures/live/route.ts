import { NextResponse } from 'next/server';
import { getLiveFixturesGroupedByLeague } from '@/backend/services/fixtureCardService';
import dbConnect from '@/lib/mongoose';


export async function GET() {
  try {
    await dbConnect();
    const fixtures = await getLiveFixturesGroupedByLeague({ allFixtures: true });

    return NextResponse.json(
      { fixtures },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
        },
      }
    );
  } catch (error) {
    console.error("Error fetching live fixture cards:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
