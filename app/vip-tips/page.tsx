"use client";

import React from "react";
import { useSession, signIn } from "next-auth/react";
import { Crown, Loader2, LockOpen } from "lucide-react";

export default function VipCenterPage() {
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
                <Crown className="w-16 h-16 text-yellow-500 mb-4" />
                <h1 className="text-3xl font-bold text-white mb-2">VIP Center</h1>
                <p className="text-gray-400 mb-8 max-w-md">
                    Sign in to manage and view your unlocked tips.
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

    return (
        <div className="min-h-screen bg-[#121212] p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Crown className="text-yellow-500 fill-yellow-500" />
                            VIP Center
                        </h1>
                        <p className="text-gray-400 mt-1">Your premium predictions hub.</p>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-[#1e1e1e]/50 rounded-3xl p-8 border border-white/5 text-center">
                    <LockOpen className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">How to Use</h2>
                    <p className="text-gray-400">
                        Go to any key match on the homepage or predictions list and click the 🔒 to unlock the specific tip relative to that match.
                        <br />Once paid and approved, the tip will be instantly visible on the match card.
                    </p>
                </div>

            </div>
        </div>
    );
}
