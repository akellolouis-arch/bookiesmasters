import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import VipFixture from '@/backend/models/VipFixture';

export async function POST(req: Request) {
    try {
        const session = await auth();
        // Hardcoded admin check
        if (!session || session.user?.email !== "emoitakelo@gmail.com") {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { fixtureId, prediction, odds, isVip, creditCost } = await req.json();

        if (!fixtureId) {
            return NextResponse.json({ error: 'Fixture ID is required' }, { status: 400 });
        }

        await dbConnect();

        // If not VIP, remove from VIP collection
        if (!isVip) {
            const deleted = await VipFixture.findOneAndDelete({ fixtureId });
            return NextResponse.json({ success: true, status: 'removed', fixture: deleted });
        }

        const updatedVipFixture = await VipFixture.findOneAndUpdate(
            { fixtureId: fixtureId },
            {
                $set: {
                    prediction,
                    customOdds: odds,
                    isVip: true,
                    creditCost: Number(creditCost)
                }
            },
            { new: true, upsert: true } // Create if not exists
        );

        return NextResponse.json({ success: true, fixture: updatedVipFixture });

    } catch (error) {
        console.error("Error updating VIP match:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
