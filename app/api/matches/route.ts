import { NextResponse } from 'next/server';
import { getFixturesGroupedByLeague } from '@/backend/services/fixtureCardService';
import dbConnect from '@/lib/mongoose';

export const dynamic = 'force-dynamic'; // Ensure no caching

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const date = searchParams.get('date');

        if (!date) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 });
        }

        await dbConnect();

        // Use the existing service to get matches formatted correctly
        const fixtures = await getFixturesGroupedByLeague(date);

        return NextResponse.json({
            date,
            fixtures
        });

    } catch (error) {
        console.error("Error fetching admin matches:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
