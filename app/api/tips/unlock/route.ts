import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/backend/models/User';
import VipFixture from '@/backend/models/VipFixture'; // Import VipFixture
// Fixture import removed as we check VipFixture for cost

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { fixtureId } = await req.json();

        if (!fixtureId) {
            return NextResponse.json({ error: 'Missing fixtureId' }, { status: 400 });
        }

        await dbConnect();

        // 1. Get the VIP Fixture to check cost
        // We now check the VipFixture collection because that's where the Admin saves the cost/status.
        const vipFixture = await VipFixture.findOne({ fixtureId: Number(fixtureId) });

        if (!vipFixture) {
            // If it's not in VipFixture, it's not a locked tip.
            return NextResponse.json({ success: true, message: 'Reference is free / Not VIP' });
        }

        const cost = vipFixture.creditCost || 0;

        // 2. Get the User to check balance
        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 3. Check if already unlocked
        if (user.unlockedTips && user.unlockedTips.includes(String(fixtureId))) {
            return NextResponse.json({ success: true, message: 'Already unlocked' });
        }

        // 4. Check Balance
        if (user.credits < cost) {
            return NextResponse.json({ error: 'Insufficient credits', required: cost, balance: user.credits }, { status: 402 });
        }

        // 5. Deduct & Save
        user.credits -= cost;
        if (!user.unlockedTips) user.unlockedTips = [];
        user.unlockedTips.push(String(fixtureId));

        // Optional: Add to purchase history
        // user.purchaseHistory.push({ date: new Date(), cost, item: fixtureId });

        await user.save();

        return NextResponse.json({
            success: true,
            newBalance: user.credits,
            message: 'Tip unlocked successfully'
        });

    } catch (error) {
        console.error("Unlock Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
