import { NextResponse } from 'next/server';
import { getFixturesGroupedByLeague, getLiveFixturesGroupedByLeague } from '@/backend/services/fixtureCardService';
import dbConnect from '@/lib/mongoose';


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });

    await dbConnect();

    let fixtures = [];
    if (date === 'live') {
      fixtures = await getLiveFixturesGroupedByLeague({ allFixtures: true });
    } else {
      fixtures = await getFixturesGroupedByLeague(date);
    }

    const isLive = date === 'live';
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
    const isPast = !isLive && date < todayStr;

    const cacheHeader = isLive
      ? 'public, s-maxage=15, stale-while-revalidate=30'
      : isPast
      ? 'public, s-maxage=86400, stale-while-revalidate=86400'
      : 'public, s-maxage=60, stale-while-revalidate=120';

    return NextResponse.json(
      { date, fixtures },
      {
        headers: {
          'Cache-Control': cacheHeader,
        },
      }
    );
  } catch (error) {
    console.error("Error fetching fixture cards:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
