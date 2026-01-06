"use client";

import React, { useState } from "react";
// @ts-ignore
import { usePaystackPayment } from "react-paystack";

interface CreditPurchaseButtonProps {
    pack: {
        credits: number;
        price: number;
        popular: boolean;
    };
    email: string;
    onSuccess: (reference: string, credits: number) => void;
}

export default function CreditPurchaseButton({ pack, email, onSuccess }: CreditPurchaseButtonProps) {
    const RATE_USD_TO_KES = 135;
    const amountInKes = Math.round(pack.price * RATE_USD_TO_KES);

    // State
    const [reference, setReference] = useState((new Date()).getTime().toString());
    const [started, setStarted] = useState(false); // Track if they clicked buy
    const [verifying, setVerifying] = useState(false);

    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";

    const config = {
        reference: reference,
        email: email,
        amount: amountInKes * 100,
        publicKey: publicKey,
        currency: 'KES',
    };

    // @ts-ignore
    const initializePayment = usePaystackPayment(config);

    const handlePay = () => {
        if (!publicKey) return alert("Missing Public Key");
        setStarted(true); // Show verify button

        // Try auto-handling (which seems to fail in some envs)
        // Fix TS error by casting to any
        const init = initializePayment as any;
        init(
            (res: any) => { onSuccess(res.reference, pack.credits); },
            () => { console.log("Closed"); }
        );
    };

    const handleManualVerify = async () => {
        setVerifying(true);
        try {
            // Manually verify the CURRENT reference
            // This assumes the user completed the payment for THIS reference
            const res = await fetch("/api/paystack/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reference, planCredits: pack.credits }),
            });
            const data = await res.json();

            if (data.success || data.message === "Transaction already processed") {
                alert("Payment Verified Successfully! Credits Added.");
                window.location.reload();
            } else {
                alert("Verification Failed: " + (data.error || "Unknown Error"));
            }
        } catch (e) {
            alert("Connection Error during verification.");
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="w-full flex flex-col gap-2">
            {!started ? (
                <button
                    onClick={handlePay}
                    className={`w-full py-3 font-bold rounded-lg transition ${pack.popular
                        ? "bg-yellow-500 hover:bg-yellow-400 text-black"
                        : "bg-white hover:bg-gray-200 text-black"
                        }`}
                >
                    Buy Now
                </button>
            ) : (
                <div className="flex flex-col gap-2 animate-in fade-in">
                    <button
                        onClick={handlePay}
                        className="w-full py-2 bg-gray-700 text-gray-300 rounded-lg text-sm"
                    >
                        Re-open Payment Popup
                    </button>
                    <button
                        onClick={handleManualVerify}
                        disabled={verifying}
                        className="w-full py-3 font-bold rounded-lg bg-green-600 hover:bg-green-500 text-white animate-pulse"
                    >
                        {verifying ? "Checking..." : "Confirm Payment Checked"}
                    </button>
                    <p className="text-xs text-center text-gray-400">
                        Click "Confirm" after paying in the popup.
                    </p>
                </div>
            )}

            <p className="text-[10px] text-gray-500 text-center">
                Processed as ~KES {amountInKes.toLocaleString()}
            </p>
        </div>
    );
}
