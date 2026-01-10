import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/backend/models/User';

// We can just import the verify logic function if we want to reuse code, 
// or implement the axios call here directly to keep it self-contained in Next App Router.

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { checkout_id, planCredits } = await req.json();

        if (!checkout_id) {
            return NextResponse.json({ error: 'Missing checkout_id' }, { status: 400 });
        }

        const TEST_MODE = process.env.INTASEND_IS_TEST === 'true';
        const SECRET_KEY = process.env.INTASEND_SECRET_KEY;
        const BASE_URL = TEST_MODE
            ? "https://sandbox.intasend.com/api/v1/"
            : "https://payment.intasend.com/api/v1/";

        // 1. Verify with Intasend
        const verifyRes = await fetch(`${BASE_URL}payment/status/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ checkout_id, invoice_id: checkout_id })
        });

        const data = await verifyRes.json();

        if (!verifyRes.ok || !data.invoice) {
            console.error("Intasend Verify Failed:", data);
            return NextResponse.json({ error: 'Verification failed with provider' }, { status: 500 });
        }

        const invoice = data.invoice;

        if (invoice.state !== 'COMPLETE' && invoice.state !== 'PAID') {
            return NextResponse.json({ error: `Payment not complete (State: ${invoice.state})` }, { status: 400 });
        }

        // 2. Update User
        await dbConnect();
        const user = await User.findOne({ email: session.user.email });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Check double spending
        if (!user.purchaseHistory) user.purchaseHistory = [];
        const exists = user.purchaseHistory.some(p => p.providerRef === invoice.invoice_id);

        if (exists) {
            return NextResponse.json({ success: true, message: "Transaction already processed" });
        }

        // Award Credits
        user.credits = (user.credits || 0) + planCredits;

        user.purchaseHistory.push({
            amount: planCredits,
            cost: invoice.net_amount, // or invoice.gross_amount
            date: new Date(),
            providerRef: invoice.invoice_id,
            provider: 'intasend'
        });

        // Save INTASEND-specific IDs if new
        // invoice.account is the email usually.
        user.intasendRef = invoice.invoice_id;

        await user.save();

        return NextResponse.json({ success: true, newBalance: user.credits });

    } catch (error) {
        console.error("Intasend API Route Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
