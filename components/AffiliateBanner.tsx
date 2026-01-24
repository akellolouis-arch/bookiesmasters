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
        <div className="fixed bottom-0 left-0 right-0 bg-[#0F2D52] text-white p-3 z-50 border-t-2 border-[#54a7ff] shadow-[0_-4px_20px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-500">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 sm:gap-6">

                {/* Left Text */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-black text-lg sm:text-xl text-[#01a0ff] drop-shadow-sm italic">
                            1XBET
                        </span>
                        <span className="hidden sm:inline-block bg-[#fb0] text-[#0F2D52] text-[10px] font-bold px-1.5 rounded-sm uppercase tracking-wide">
                            Special Offer
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-200 leading-tight">
                        Register now & get <span className="text-[#fb0] font-bold">200% Bonus</span> (up to 20,000 KES).
                    </p>
                </div>

                {/* Promo Code Action */}
                <div className="flex flex-col items-end gap-1">
                    <span className="hidden sm:block text-[10px] text-gray-400 uppercase tracking-wider font-semibold mr-1">
                        Use Promo Code
                    </span>
                    <div className="flex items-center gap-2 bg-[#0b223f] rounded px-1 py-1 border border-[#1e4e8a]">
                        <div className="text-white font-mono font-bold text-sm tracking-widest px-2">
                            {PROMO_CODE}
                        </div>
                        <button
                            onClick={handleCopy}
                            className="bg-[#3dad07] hover:bg-[#349606] text-white text-xs font-bold py-1.5 px-3 rounded transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? "COPIED" : "COPY"}
                        </button>
                    </div>
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
