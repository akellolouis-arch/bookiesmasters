import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Fixture from '@/backend/models/Fixture';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await dbConnect();

        // Find one fixture that has prediction data
        // We explicitly select 'prediction' and 'fixture' to give context, but user asked for "prediction data"
        // I'll return the whole document to be safe, or just the prediction if it's huge. 
        // User asked for "structure of the prediction data", implies the whole object stored in 'prediction'.
        // I'll return the whole fixture document but limit fields if needed. 
        // Let's just return one complete document where prediction exists.
        const fixture = await Fixture.findOne({ prediction: { $ne: null } }).lean();

        if (!fixture) {
            return NextResponse.json({ error: 'No fixture with prediction data found' }, { status: 404 });
        }

        return NextResponse.json(fixture, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
