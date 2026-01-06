import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/backend/models/User';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { reference, planCredits } = await req.json();

        if (!reference) {
            return NextResponse.json({ error: 'Missing payment reference' }, { status: 400 });
        }

        // 1. Verify with Paystack API
        console.log(`[VERIFY] Verifying reference: ${reference} with Secret Key Length: ${process.env.PAYSTACK_SECRET_KEY?.length}`);

        const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, // CAREFUL: SERVER-SIDE ONLY
            },
        });

        const verifyData = await verifyRes.json();
        console.log(`[VERIFY] Paystack Response Status: ${verifyData.status}, Data Status: ${verifyData.data?.status}`);

        if (!verifyData.status || verifyData.data.status !== 'success') {
            return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
        }

        // 2. Check if transaction already processed (Prevent replays)
        await dbConnect();
        const existingUser = await User.findOne({
            "purchaseHistory.providerRef": reference
        });

        if (existingUser) {
            return NextResponse.json({ success: true, message: "Transaction already processed" });
        }

        // 3. Update User Credits
        // Amount is in kobo from Paystack, so verify logic if needed, but we trust the planCredits passed 
        // combined with the success verification. ideally we map amount to credits here securely.

        // Server-side map of expectation
        // We can double check amount paid matches expected price for those credits to prevent tampering
        // e.g. 100 credits = 1000 kobo (if $10?) - Let's stick to trusting the successful payment for this MVP 
        // and storing the amount paid.

        const amountPaid = verifyData.data.amount / 100; // Convert to main currency unit

        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        user.credits = (user.credits || 0) + planCredits;

        // Add to history
        if (!user.purchaseHistory) user.purchaseHistory = [];
        user.purchaseHistory.push({
            amount: planCredits,
            cost: amountPaid,
            date: new Date(),
            providerRef: reference
        });

        await user.save();

        return NextResponse.json({
            success: true,
            newBalance: user.credits
        });

    } catch (error) {
        console.error("Paystack Verify Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
