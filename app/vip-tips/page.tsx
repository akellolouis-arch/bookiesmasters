"use client";

import React, { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import dynamic from "next/dynamic";
import { Crown, Loader2, Coins, CheckCircle } from "lucide-react";
import UserWallet from "@/components/UserWallet";

// Dynamic import with SSR disabled to prevent "window is not defined" error
const CreditPurchaseButton = dynamic(
    () => import("@/components/CreditPurchaseButton"),
    { ssr: false, loading: () => <button className="w-full py-3 bg-gray-600 rounded-lg animate-pulse">Loading...</button> }
);

export default function BuyCreditsPage() {
    const { data: session, status } = useSession();

    // Hardcoded credit packs for now (Step 1)
    const packs = [
        { credits: 100, price: 10, label: "Starter Pack", popular: false },
        { credits: 500, price: 40, label: "Pro Pack", popular: true, bonus: "Save $10" },
        { credits: 1000, price: 75, label: "Expert Pack", popular: false, bonus: "Stationary + Save $25" },
    ];

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-4 text-center">
                <Coins className="w-16 h-16 text-yellow-500 mb-4" />
                <h1 className="text-3xl font-bold text-white mb-2">Buy Credits</h1>
                <p className="text-gray-400 mb-8 max-w-md">
                    Sign in to purchase credits and unlock premium predictions.
                </p>
                <button
                    onClick={() => signIn("google")}
                    className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition"
                >
                    Sign In to Continue
                </button>
            </div>
        );
    }

    const handleSuccess = async (reference: string, credits: number) => {
        try {
            const res = await fetch("/api/paystack/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reference, planCredits: credits }),
            });
            const data = await res.json();
            if (data.success) {
                alert("Payment Successful! Credits added.");
                window.location.reload();
            } else {
                alert("Payment Verification Failed: " + data.error);
            }
        } catch (err) {
            alert("Error verifying payment");
        }
    };


    return (
        <div className="min-h-screen bg-[#121212] p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Crown className="text-yellow-500 fill-yellow-500" />
                            Get VIP Credits
                        </h1>
                        <p className="text-gray-400 mt-1">Unlock high-confidence tips instantly.</p>
                    </div>
                    <div className="hidden md:block">
                        <UserWallet />
                    </div>
                </div>

                {/* Packs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {packs.map((pack) => (
                        <div
                            key={pack.credits}
                            className={`relative bg-[#1e1e1e] border rounded-2xl p-6 flex flex-col items-center text-center transition hover:scale-105 ${pack.popular ? "border-yellow-500 shadow-xl shadow-yellow-500/10" : "border-white/10"
                                }`}
                        >
                            {pack.popular && (
                                <div className="absolute top-0 right-0 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
                                    MOST POPULAR
                                </div>
                            )}

                            <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4 text-yellow-500">
                                <Coins className="w-8 h-8" />
                            </div>

                            <h3 className="text-xl font-bold text-white">{pack.label}</h3>
                            <div className="text-4xl font-bold text-white mt-2 mb-1">
                                ${pack.price}
                            </div>
                            <p className="text-yellow-500 font-medium mb-6">
                                {pack.credits} Credits
                            </p>

                            {pack.bonus && (
                                <div className="mb-6 px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                                    {pack.bonus}
                                </div>
                            )}

                            <ul className="text-left space-y-3 mb-8 w-full px-4">
                                <li className="flex items-center gap-2 text-sm text-gray-300">
                                    <CheckCircle className="w-4 h-4 text-green-500" /> Instant Delivery
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-300">
                                    <CheckCircle className="w-4 h-4 text-green-500" /> No Expiry Date
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-300">
                                    <CheckCircle className="w-4 h-4 text-green-500" /> Unlock Any Tip
                                </li>
                            </ul>

                            <CreditPurchaseButton
                                pack={pack}
                                email={session.user?.email || ""}
                                onSuccess={handleSuccess}
                            />
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center text-gray-500 text-sm">
                    <p>Secure payments powered by Paystack. Credits are non-refundable once used.</p>
                </div>
            </div>
        </div>
    );
}
