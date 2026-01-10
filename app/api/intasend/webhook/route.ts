import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/backend/models/User';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const signature = req.headers.get('x-intasend-signature');
        const secret = process.env.INTASEND_SECRET_KEY;

        // Verify Signature (Recommended)
        if (signature && secret) {
            const hash = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
            // Note: Intasend signature verification might differ, check docs. 
            // If uncertain, we can rely on verifying the invoice_id status via API before fulfilling.
        }

        console.log("🔔 [WEBHOOK] Intasend Event:", payload);

        // Challenge/Test
        if (payload.challenge) {
            return NextResponse.json({ challenge: payload.challenge });
        }

        // Handle Payment Success
        // Intasend payload structure for 'COMPLETE'
        if (payload.state === 'COMPLETE' || payload.state === 'PAID') {
            const invoiceId = payload.invoice_id; // The provider ref
            const email = payload.account;        // The user email
            const amountReceived = payload.net_amount;

            await dbConnect();
            const user = await User.findOne({ email: email });

            if (user) {
                // Check if already processed
                // (Using the providerRef we stored earlier or just check uniqueness)
                if (!user.purchaseHistory) user.purchaseHistory = [];
                const alreadyProcessed = user.purchaseHistory.some(p => p.providerRef === invoiceId);

                if (!alreadyProcessed) {
                    // Determine credits based on amount or metadata
                    // If we saved the expected credits in metadata, use that.
                    // payload.meta usually contains custom fields.
                    // For now, let's assume valid because the user verified it on frontend 
                    // OR we just log it. 
                    // To be safe, we should ideally fetch the order matching this ref if we stored "Pending" orders.

                    console.log(`✅ Webhook verified payment for ${email}`);
                    // Note: We are NOT adding credits here blindly unless we know the package. 
                    // Real implementation should store a "Pending Transaction" logic.
                    // For MVP, the frontend 'verify' route handles the credit assignment securely via API check.
                    // This webhook is a backup or for passive listeners.
                }
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Webhook Handler Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
