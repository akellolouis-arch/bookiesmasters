"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";

export default function BetButton({ teamName }: { teamName?: string }) {
    const [copied, setCopied] = useState(false);
    const PROMO_CODE = "BKMS254";
    const AFFILIATE_LINK = "https://refpa7921972.top/L?tag=d_3862629m_1573c_&site=3862629&ad=1573";

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent card expansion if inside a clickable card

        // 1. Copy Code
        navigator.clipboard.writeText(PROMO_CODE);
        setCopied(true);

        // 2. Open Site after small delay to let user see "Copied"
        setTimeout(() => {
            setCopied(false);
            window.open(AFFILIATE_LINK, "_blank");
        }, 800);
    };

    return (
        <button
            onClick={handleClick}
            className={`
        group relative overflow-hidden rounded-lg px-4 py-1.5 
        bg-gradient-to-r from-[#004e92] to-[#000428] 
         hover:from-[#005bea] hover:to-[#00c6fb]
        text-white font-bold text-xs sm:text-sm shadow-md transition-all duration-300
        border border-white/10 hover:border-white/30
        flex items-center gap-2 justify-center
      `}
        >
            {/* Background Sheen Effect */}
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />

            {copied ? (
                <>
                    <Check size={14} className="text-green-400" />
                    <span className="text-green-400">Code Copied!</span>
                </>
            ) : (
                <>
                    <div className="flex flex-col items-center leading-none mr-2">
                        <span className="text-[9px] text-[#fb0] font-black uppercase tracking-widest mb-0.5 animate-pulse">USE CODE</span>
                        <span className="text-white font-bold text-xs tracking-wider">{PROMO_CODE}</span>
                    </div>
                    <span className="w-px h-6 bg-white/20 mx-1" />
                    <span className="font-bold text-sm">BET 1XBET</span>
                    <ExternalLink size={12} className="opacity-70" />
                </>
            )}
        </button>
    );
}
