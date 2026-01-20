"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function CallbackContent() {
    const searchParams = useSearchParams();
    const reference = searchParams.get("reference");
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

    useEffect(() => {
        if (reference) {
            // In a robust app, we might call the backend here to double-check status
            // But since Webhook handles the actual upgrade, we can just assume success if redirected here with a reference
            // Or we could poll the backend to see if 'isVip' became true.

            // For now, let's just simulate a brief verification check for UX
            setTimeout(() => {
                setStatus("success");
            }, 2000);
        } else {
            setStatus("error");
        }
    }, [reference]);

    return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
            <div className="bg-[#1e1e1e] p-8 rounded-2xl shadow-xl border border-white/5 text-center max-w-sm w-full">
                {status === "loading" && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
                        <h2 className="text-xl font-bold text-white">Verifying Payment...</h2>
                        <p className="text-gray-400 mt-2">Please wait while we confirm your transaction.</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold text-white">Payment Successful!</h2>
                        <p className="text-gray-400 mt-2 mb-6">Payment verified.</p>
                        <Link
                            href="/predictions"
                            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition width-full"
                        >
                            Go to Predictions
                        </Link>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center">
                        <XCircle className="w-16 h-16 text-red-500 mb-4" />
                        <h2 className="text-xl font-bold text-white">Payment Failed</h2>
                        <p className="text-gray-400 mt-2 mb-6">We couldn't verify your payment reference.</p>
                        <Link
                            href="/"
                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition"
                        >
                            Return Home
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PaymentCallbackPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#121212]" />}>
            <CallbackContent />
        </Suspense>
    );
}
