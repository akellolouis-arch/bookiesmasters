"use client";

import { useState } from "react";
import { ExternalLink, Trophy, Zap } from "lucide-react";

// Helper for odds color
function getOddsColor(value: string, allOdds: { value: string; odd: string }[]): string {
    const num = parseFloat(value);
    if (isNaN(num)) return "text-white";

    const nums = allOdds.map(o => parseFloat(o.odd)).filter(n => !isNaN(n));
    const max = Math.max(...nums);
    const min = Math.min(...nums);
    const countMax = nums.filter(n => n === max).length;
    const countMin = nums.filter(n => n === min).length;

    if (num === min && countMin === 1) return "text-green-400"; // Low -> Green
    if (num === max && countMax === 1) return "text-red-400";   // High -> Red
    return "text-yellow-400"; // Mid -> Yellow
}

interface BetButtonProps {
    teamName?: string;
    odds?: { value: string; odd: string }[];
    isLive?: boolean;
}

export default function BetButton({ teamName, odds, isLive = false }: BetButtonProps) {
    const TELEGRAM_LINK = "https://t.me/bookiesm";

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(TELEGRAM_LINK, "_blank");
    };

    return (
        <button
            onClick={handleClick}
            className={`
            group relative overflow-hidden rounded-lg px-2 py-1.5 
            border border-white/10 hover:border-white/20
            bg-[#1a1a1a] hover:bg-[#252525]
            shadow-sm hover:shadow-md transition-all duration-300
            flex items-center justify-center gap-2 w-full sm:w-full lg:max-w-3xl mx-auto
            mt-1 mb-2
          `}
        >
            {/* Odds Display Only */}
            {odds && odds.length > 0 ? (
                <div className="flex items-center justify-between w-full min-w-[120px] px-2">
                    {odds.map((o, i) => (
                        <div key={i} className="flex flex-col items-center flex-1">
                            <span className="text-[9px] text-gray-400 font-bold leading-none mb-1">
                                {o.value === "Home" ? "1" : o.value === "Draw" ? "X" : "2"}
                            </span>
                            <span className={`font-bold text-xs sm:text-xs leading-none ${getOddsColor(o.odd, odds)}`}>
                                {o.odd}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                    View Odds <ExternalLink size={12} />
                </span>
            )}
        </button>
    );
}
