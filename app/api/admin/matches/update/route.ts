import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import Fixture from '@/backend/models/Fixture';
// import VipFixture from '@/backend/models/VipFixture'; // 🚫 No longer using VIP model

export async function POST(req: Request) {
    try {
        const session = await auth();
        // Hardcoded admin check
        if (!session || session.user?.email !== "emoitakelo@gmail.com") {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { fixtureId, prediction, odds } = await req.json();

        if (!fixtureId) {
            return NextResponse.json({ error: 'Fixture ID is required' }, { status: 400 });
        }

        await dbConnect();

        // Update the main Fixture document with the custom prediction (manual tip)
        const updatedFixture = await Fixture.findOneAndUpdate(
            { fixtureId: Number(fixtureId) },
            {
                $set: {
                    customPrediction: prediction || null, // Allow clearing it
                    customOdds: odds // Optional: store manual odds if needed on main doc
                }
            },
            { new: true }
        );

        if (!updatedFixture) {
            return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, fixture: updatedFixture });

    } catch (error) {
        console.error("Error updating match override:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
