import React, { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { Crown, Loader2, Coins } from "lucide-react";
import UserWallet from "@/components/UserWallet";
// import SpinWheel from "@/components/SpinWheel"; // Deleted
import PaymentForm from "@/components/PaymentForm";

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
                <h1 className="text-3xl font-bold text-white mb-2">Login to Buy Credits</h1>
                <p className="text-gray-400 mb-8 max-w-md">
                    Sign in to purchase credits securely and unlock VIP tips.
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
                        <p className="text-gray-400 mt-1">Unlock winning predictions directly from the fixtures page.</p>
                    </div>
                    <div className="hidden md:block">
                        <UserWallet />
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-[#1e1e1e]/50 rounded-3xl p-8 border border-white/5 text-center">
                    <p className="text-gray-400">Go to any key match and click the 🔒 to purchase the tip.</p>
                </div>

            </div>
        </div>
    );
}
