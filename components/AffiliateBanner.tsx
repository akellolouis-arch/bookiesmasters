"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check } from "lucide-react";

export default function AffiliateBanner() {
    const [isVisible, setIsVisible] = useState(true);
    const [copied, setCopied] = useState(false);
    const PROMO_CODE = "BKMS254";
    const REGISTER_URL = "https://refpa7921972.top/L?tag=d_3862629m_1573c_&site=3862629&ad=1573"; // Replace with your actual affiliate link if you have one, otherwise just promo code usage is often manual for users on the site. 
    // IMPORTANT: User only gave promo code. I will assume a generic 1xbet link or just rely on the code. 
    // Usually affiliates have a specific link. I'll use a placeholder or ask, but for now just the code functionality.
    // Wait, the user didn't provide a link, only said "that is 1xbet's promocode".
    // A generic 1xBet link is fine if the code is what tracks, but usually the link also tracks.
    // I'll stick to just the code copy for now, or a generic homepage link.

    const handleCopy = () => {
        navigator.clipboard.writeText(PROMO_CODE);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        // Optional: Redirect to 1xbet after copy
        // window.open("https://1xbet.co.ke", "_blank"); 
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-900 to-blue-700 text-white p-3 z-50 border-t border-blue-500 shadow-lg animate-in slide-in-from-bottom duration-500">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">

                {/* Left Text */}
                <div className="flex-1">
                    <p className="font-bold text-sm sm:text-base text-yellow-400 uppercase tracking-wide">
                        200% Welcome Bonus!
                    </p>
                    <p className="text-xs sm:text-sm text-blue-100">
                        Get up to 20,000 KES on your first deposit.
                    </p>
                </div>

                {/* Promo Code Action */}
                <div className="flex items-center gap-2 bg-blue-950/50 rounded-lg p-1 pr-3 border border-blue-400/30">
                    <div className="bg-yellow-500 text-black font-extrabold text-sm px-2 py-1 rounded">
                        {PROMO_CODE}
                    </div>
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 text-xs font-semibold hover:text-yellow-300 transition-colors"
                    >
                        {copied ? (
                            <>
                                <Check size={14} className="text-green-400" />
                                <span className="text-green-400">Copied</span>
                            </>
                        ) : (
                            <>
                                <Copy size={14} />
                                <span>Copy Code</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Close Button */}
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-blue-300 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

            </div>
        </div>
    );
}
