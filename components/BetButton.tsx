"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";

interface BetButtonProps {
    teamName?: string;
    odds?: { value: string; odd: string }[];
}

export default function BetButton({ teamName, odds }: BetButtonProps) {
    const [copied, setCopied] = useState(false);
    const PROMO_CODE = "BKMS254";
    const AFFILIATE_LINK = "https://1xbet.com/en/user/registration";

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        navigator.clipboard.writeText(PROMO_CODE);
        setCopied(true);

        setTimeout(() => {
            setCopied(false);
            window.open(AFFILIATE_LINK, "_blank");
        }, 800);
    };

    return (
        <button
            onClick={handleClick}
            className={`
        group relative overflow-hidden rounded-lg px-2 sm:px-4 py-2 
        bg-gradient-to-r from-[#004e92] to-[#000428] 
         hover:from-[#005bea] hover:to-[#00c6fb]
        text-white font-bold text-xs sm:text-sm shadow-md transition-all duration-300
        border border-white/10 hover:border-white/30
        flex items-center gap-2 sm:gap-4 justify-between w-full sm:w-auto
      `}
        >
            {/* Background Sheen */}
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />

            {copied ? (
                <div className="flex items-center justify-center w-full gap-2 py-1 bg-[#23a516] absolute inset-0 text-white animate-in zoom-in-50 duration-300">
                    <Check size={18} className="text-white shrink-0" />
                    <span className="font-black text-[10px] sm:text-xs uppercase tracking-tight leading-none text-center">
                        Code Copied! Use it to register & get 200% Bonus!
                    </span>
                </div>
            ) : (
                <>
                    {/* Left: Promo Code */}
                    <div className="flex flex-col items-start leading-none shrink-0">
                        <span className="text-[8px] sm:text-sm text-[#fb0] font-black uppercase tracking-widest mb-0.5 animate-pulse">
                            ✨ PROMOCODE ✨
                        </span>
                        <span className="text-white font-bold text-xs sm:text-sm tracking-wider font-mono">
                            {PROMO_CODE}
                        </span>
                    </div>

                    {/* Middle: CTA (Hidden on very small screens if needed, or kept compact) */}
                    <div className="flex items-center gap-1 shrink-0">
                        <span className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />
                        <span className="font-bold text-xs sm:text-sm whitespace-nowrap">BET 1XBET</span>
                    </div>

                    {/* Right: Odds (if available) - Mobile optimized */}
                    {odds && odds.length > 0 && (
                        <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
                            {odds.map((o, i) => (
                                <div key={i} className="flex flex-col items-center min-w-[24px]">
                                    <span className="text-[8px] text-gray-400 font-bold leading-none mb-0.5">
                                        {o.value === "Home" ? "1" : o.value === "Draw" ? "X" : "2"}
                                    </span>
                                    <span className="text-[#fb0] font-bold text-[10px] sm:text-xs leading-none">
                                        {o.odd}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </button>
    );
}
