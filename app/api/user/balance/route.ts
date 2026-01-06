import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/backend/models/User';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Use email as unique identifier from Auth.js session
        const user = await User.findOne({ email: session.user.email }).select('credits unlockedTips');

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            credits: user.credits || 0,
            unlockedTips: user.unlockedTips || []
        });

    } catch (error: any) {
        console.error("Error fetching balance:", error);
        return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
    }
}
