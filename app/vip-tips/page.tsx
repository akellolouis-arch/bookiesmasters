"use client";

import React, { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { Lock, Crown, Loader2, CheckCircle } from "lucide-react";
import PricingModal from "@/components/PricingModal";

export default function VipTipsPage() {
    const { data: session, status } = useSession();
    const [showPricing, setShowPricing] = useState(false);

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
            </div>
        );
    }

    // 1. Not Logged In
    if (!session) {
        return (
            <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-4 text-center">
                <Lock className="w-16 h-16 text-gray-500 mb-4" />
                <h1 className="text-3xl font-bold text-white mb-2">VIP Access Required</h1>
                <p className="text-gray-400 mb-8 max-w-md">
                    Sign in to access high-confidence predictions and professional insights.
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

    // 2. Logged In but NOT VIP
    // @ts-ignore - isVip is added in auth.ts
    if (!session.user?.isVip) {
        return (
            <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
                {/* Background visual effect */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500 rounded-full blur-[128px]" />
                </div>

                <div className="z-10 bg-[#1e1e1e] border border-yellow-500/20 p-8 rounded-2xl max-w-lg w-full shadow-2xl">
                    <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-white mb-2">Upgrade to VIP</h1>
                    <p className="text-gray-400 mb-6">
                        Unlock our daily high-confidence tips, injury reports, and advanced stats.
                    </p>

                    <div className="space-y-4 mb-8 text-left">
                        <div className="flex items-center gap-3 text-gray-300">
                            <CheckCircle className="text-green-500 w-5 h-5" /> <span>Daily 90%+ Confidence Tips</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-300">
                            <CheckCircle className="text-green-500 w-5 h-5" /> <span>Instant Lineup Notifications</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-300">
                            <CheckCircle className="text-green-500 w-5 h-5" /> <span>Full H2H & Form Analysis</span>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowPricing(true)}
                        className="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold rounded-xl transition transform hover:scale-[1.02] shadow-lg shadow-yellow-500/20"
                    >
                        Unlock Now for $9.99/mo
                    </button>
                </div>

                <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />
            </div>
        );
    }

    // 3. VIP ACCESS GRANTED
    return (
        <div className="min-h-screen bg-[#121212] p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                            <Crown className="fill-yellow-500 text-yellow-500" /> VIP Predictions
                        </h1>
                        <p className="text-gray-400">Exclusive high-confidence tips for today.</p>
                    </div>
                    <div className="px-4 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500 text-sm font-medium">
                        Status: Active
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Placeholder for TIPS */}
                    <div className="bg-[#1e1e1e] border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center text-center h-64 col-span-full">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <Loader2 className="w-8 h-8 text-gray-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No VIP Tips Yet Today</h3>
                        <p className="text-gray-500 max-w-sm">
                            Our analysts are currently finalizing the predictions for today's matches. Check back in a few hours.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
