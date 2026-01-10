"use client";

import React, { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { Crown, Loader2, Coins } from "lucide-react";
import UserWallet from "@/components/UserWallet";
import SpinWheel from "@/components/SpinWheel";

export default function BuyCreditsPage() {
    const { data: session, status } = useSession();

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
                <h1 className="text-3xl font-bold text-white mb-2">Login to Spin!</h1>
                <p className="text-gray-400 mb-8 max-w-md">
                    Sign in to use the daily lucky spin and win free credits.
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

    const handleWin = (amount: number) => {
        // Optionally trigger a global confetti or update wallet via context if needed.
        // A reload ensures header wallet updates too.
        setTimeout(() => window.location.reload(), 3500);
    };

    return (
        <div className="min-h-screen bg-[#121212] p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Crown className="text-yellow-500 fill-yellow-500" />
                            Daily Lucky Spin
                        </h1>
                        <p className="text-gray-400 mt-1">Spin the wheel every day to earn FREE credits.</p>
                    </div>
                    <div className="hidden md:block">
                        <UserWallet />
                    </div>
                </div>

                {/* Spin Wheel Area */}
                <div className="bg-[#1e1e1e] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50"></div>

                    <SpinWheel
                        email={session.user?.email || ""}
                        onWin={handleWin}
                    />

                    <p className="text-center text-gray-500 text-sm mt-8">
                        Come back every 20 hours for a new chance to win up to 500 Credits!
                    </p>
                </div>

            </div>
        </div>
    );
}
