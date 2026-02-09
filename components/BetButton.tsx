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

    if (num === min && countMin === 1) return "text-green-300"; // Lowest -> Green
    if (num === max && countMax === 1) return "text-red-300";   // Highest -> Red
    return "text-yellow-200"; // Middle -> Orange/Gold
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

        // Track Click (Optional: Add Pixel event here later)
        window.open(TELEGRAM_LINK, "_blank");
    };

    return (
        <button
            onClick={handleClick}
            className={`
            group relative overflow-hidden rounded-xl w-full sm:w-full lg:max-w-3xl mx-auto
            bg-gradient-to-r from-orange-600 via-orange-500 to-yellow-500
            hover:from-orange-500 hover:to-yellow-400
            border-t border-yellow-300/40 border-b border-orange-700/50
            shadow-[0_0_15px_rgba(249,115,22,0.4)] hover:shadow-[0_0_25px_rgba(249,115,22,0.6)]
            transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.98]
            mt-2 mb-4
            `}
        >
            {/* Shimmer/Pulse Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]" />
            <div className="absolute inset-0 bg-white/5 animate-pulse" />

            <div className="relative flex flex-col justify-center px-4 py-3">

                {/* Main CTA Section */}
                <div className="flex items-center justify-between w-full mb-2">
                    {/* Left: Icon & Text */}
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm border border-white/10 shadow-inner">
                            <Trophy className="w-5 h-5 text-yellow-100 drop-shadow-md" />
                        </div>
                        <div className="flex flex-col items-start text-left">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-extrabold text-white bg-red-600 px-1.5 py-0.5 rounded shadow-sm animate-pulse">
                                    VIP
                                </span>
                                <span className="text-[10px] font-bold text-orange-100 uppercase tracking-widest">
                                    HIGH ODDS
                                </span>
                            </div>
                            <span className="text-white font-black text-lg sm:text-xl italic leading-none drop-shadow-sm mt-0.5">
                                UNLOCK 3+ ODDS
                            </span>
                        </div>
                    </div>

                    {/* Right: Action Button */}
                    <div className="flex items-center gap-1.5 bg-black/30 hover:bg-black/40 px-3 py-2 rounded-lg border border-white/10 transition-colors">
                        <span className="text-xs font-bold text-white uppercase">JOIN</span>
                        <ExternalLink className="w-3.5 h-3.5 text-white" />
                    </div>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-1" />

                {/* Odds Preview (Teaser) */}
                {odds && odds.length > 0 ? (
                    <div className="flex justify-between items-center w-full px-1">
                        <div className="flex items-center gap-1.5">
                            {isLive && (
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                            )}
                            <span className="text-[10px] text-orange-100 font-medium tracking-wide">
                                {isLive ? "LIVE NOW" : "TODAY'S INSIDER PICK"}
                            </span>
                        </div>

                        <div className="flex gap-2.5">
                            {odds.map((o, i) => (
                                <div key={i} className="flex flex-col items-center leading-none">
                                    <span className="text-[9px] text-white/70 font-bold mb-0.5">
                                        {o.value === "Home" ? "1" : o.value === "Draw" ? "X" : "2"}
                                    </span>
                                    <span className={`text-xs font-black ${getOddsColor(o.odd, odds)} drop-shadow-sm`}>
                                        {o.odd}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center w-full">
                        <span className="text-[10px] text-orange-100 font-medium">
                            Join for Daily Wins
                        </span>
                    </div>
                )}

            </div>
        </button>
    );
}
