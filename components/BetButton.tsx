"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";

// Helper for odds color
function getOddsColor(value: string, allOdds: { value: string; odd: string }[]): string {
    const num = parseFloat(value);
    if (isNaN(num)) return "text-[#fb0]";

    const nums = allOdds.map(o => parseFloat(o.odd)).filter(n => !isNaN(n));
    const max = Math.max(...nums);
    const min = Math.min(...nums);
    const countMax = nums.filter(n => n === max).length;
    const countMin = nums.filter(n => n === min).length;

    if (num === min && countMin === 1) return "text-green-400"; // Lowest -> Green
    if (num === max && countMax === 1) return "text-red-400";   // Highest -> Red
    return "text-[#fb0]"; // Middle -> Orange/Gold
}

interface BetButtonProps {
    teamName?: string;
    odds?: { value: string; odd: string }[];
    isLive?: boolean; // NEW PROP
}

export default function BetButton({ teamName, odds, isLive = false }: BetButtonProps) {
    const [copied, setCopied] = useState(false);
    const PROMO_CODE = "BKMS254";
    const AFFILIATE_LINK = "https://reffpa.com/L?tag=d_5148910m_97c_telegram&site=5148910&ad=97&r=registration";

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(AFFILIATE_LINK, "_blank");
    };

    return (
        <button
            onClick={handleClick}
            className={`
            group relative overflow-hidden rounded-lg px-3 sm:px-5 py-2.5 
            bg-gradient-to-r from-[#004e92] to-[#000428] 
             hover:from-[#005bea] hover:to-[#00c6fb]
            text-white font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all duration-300
            border border-white/10 hover:border-white/30
            flex items-center gap-3 w-full sm:w-auto justify-center
          `}
        >
            {/* Background Sheen */}
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />

            {/* Main CTA */}
            <div className="flex flex-col items-center leading-none">
                <div className="flex items-center gap-2">
                    <span className="font-black text-sm sm:text-base whitespace-nowrap tracking-wide">BET ON 1XBET</span>
                    <ExternalLink size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[9px] sm:text-[10px] text-[#fb0] font-black uppercase tracking-widest animate-pulse">
                        GET 200% BONUS
                    </span>
                </div>
            </div>

            {/* Right: Odds (Optional Divider) */}
            {odds && odds.length > 0 && (
                <div className="flex items-center gap-1.5 pl-3 border-l border-white/10 ml-1">
                    {odds.map((o, i) => (
                        <div key={i} className="flex flex-col items-center min-w-[24px]">
                            <span className="text-[8px] text-gray-400 font-bold leading-none mb-0.5">
                                {o.value === "Home" ? "1" : o.value === "Draw" ? "X" : "2"}
                            </span>
                            <span className={`font-bold text-[10px] sm:text-xs leading-none ${getOddsColor(o.odd, odds)}`}>
                                {o.odd}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </button>
    );
}
