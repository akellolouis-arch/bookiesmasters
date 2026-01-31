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
    const TELEGRAM_LINK = "https://t.me/bookiesm";

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // No Pixel Track for this button as requested
        window.open(TELEGRAM_LINK, "_blank");
    };

    return (
        <button
            onClick={handleClick}
            className={`
            group relative overflow-hidden rounded-lg px-2 py-1.5 
            bg-[#1F1F1F] hover:bg-[#2F2F2F] border border-white/5 hover:border-white/10
            shadow-sm hover:shadow-md transition-all duration-300
            flex items-center justify-center gap-2 w-full sm:w-auto
          `}
        >
            {/* Odds Display Only */}
            {odds && odds.length > 0 ? (
                <div className="flex items-center gap-2">
                    {odds.map((o, i) => (
                        <div key={i} className="flex flex-col items-center min-w-[30px] px-1">
                            <span className="text-[9px] text-gray-500 font-bold leading-none mb-1">
                                {o.value === "Home" ? "1" : o.value === "Draw" ? "X" : "2"}
                            </span>
                            <span className={`font-bold text-xs sm:text-sm leading-none ${getOddsColor(o.odd, odds)}`}>
                                {o.odd}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <span className="text-xs text-gray-500 font-medium">View</span>
            )}
        </button>
    );
}
