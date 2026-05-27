"use client";

import React, { useState } from "react";
import Image from "next/image";

interface TeamStatsProps {
    homeTeam: {
        id: number;
        name: string;
        logo: string;
        allMatches?: any[];
    };
    awayTeam: {
        id: number;
        name: string;
        logo: string;
        allMatches?: any[];
    };
}

const OverallStatistics: React.FC<TeamStatsProps> = ({ homeTeam, awayTeam }) => {
    const [locationMode, setLocationMode] = useState<"overall" | "home_away">("overall");
    const [timeframe, setTimeframe] = useState<"full" | "first_half" | "second_half">("full");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const calculateTeamStats = (matches: any[], teamId: number, filterLoc: 'all' | 'home' | 'away') => {
        let played = 0;
        let scored = 0;
        let conceded = 0;
        let scoredMatches = 0;

        if (!matches || !Array.isArray(matches)) {
            return { played: 0, scored: 0, conceded: 0, scoredMatches: 0, avgScored: "0.00", avgConceded: "0.00", scoredPercent: 0 };
        }

        matches.forEach(m => {
            const isHome = m.homeTeam?.id === teamId;
            const isAway = m.awayTeam?.id === teamId;

            if (!isHome && !isAway) return;
            if (filterLoc === 'home' && !isHome) return;
            if (filterLoc === 'away' && !isAway) return;

            // formCalculator.js only returns completed matches, so no status check needed.
            let gHome = 0;
            let gAway = 0;

            if (timeframe === 'full') {
                gHome = m.score?.home ?? 0;
                gAway = m.score?.away ?? 0;
            } else if (timeframe === 'first_half') {
                gHome = m.score?.halftime?.home ?? 0;
                gAway = m.score?.halftime?.away ?? 0;
            } else if (timeframe === 'second_half') {
                const ftHome = m.score?.home ?? 0;
                const ftAway = m.score?.away ?? 0;
                const htHome = m.score?.halftime?.home ?? 0;
                const htAway = m.score?.halftime?.away ?? 0;
                gHome = Math.max(0, ftHome - htHome);
                gAway = Math.max(0, ftAway - htAway);
            }

            played++;
            const teamGoals = isHome ? gHome : gAway;
            const oppGoals = isHome ? gAway : gHome;

            scored += teamGoals;
            conceded += oppGoals;

            if (teamGoals > 0) {
                scoredMatches++;
            }
        });

        return {
            played,
            scored,
            conceded,
            scoredMatches,
            avgScored: played ? (scored / played).toFixed(2) : "0.00",
            avgConceded: played ? (conceded / played).toFixed(2) : "0.00",
            scoredPercent: played ? Math.round((scoredMatches / played) * 100) : 0,
            failedPercent: played ? 100 - Math.round((scoredMatches / played) * 100) : 0
        };
    };

    const homeStats = calculateTeamStats(
        homeTeam.allMatches || [],
        homeTeam.id,
        locationMode === "overall" ? "all" : "home"
    );

    const awayStats = calculateTeamStats(
        awayTeam.allMatches || [],
        awayTeam.id,
        locationMode === "overall" ? "all" : "away"
    );

    const timeframeLabels = {
        "full": "Full time",
        "first_half": "First half",
        "second_half": "Second half"
    };

    return (
        <div className="w-full mt-4 animate-in fade-in duration-500">
            <h3 className="text-xs font-bold tracking-wide capitalize text-center text-amber-100 mb-4 border-b border-white/10 pb-2">
                OVERALL STATISTICS
            </h3>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 px-2">
                <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
                    <button
                        onClick={() => setLocationMode("overall")}
                        className={`px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all ${locationMode === "overall" ? "bg-white text-black" : "text-gray-400 hover:text-white"}`}
                    >
                        Overall
                    </button>
                    <button
                        onClick={() => setLocationMode("home_away")}
                        className={`px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all ${locationMode === "home_away" ? "bg-white text-black" : "text-gray-400 hover:text-white"}`}
                    >
                        Home/Away
                    </button>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-all"
                    >
                        {timeframeLabels[timeframe]}
                        <span className="text-[8px]">▼</span>
                    </button>
                    
                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-1 w-32 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl overflow-hidden z-20">
                            {(["full", "first_half", "second_half"] as const).map(tf => (
                                <button
                                    key={tf}
                                    onClick={() => { setTimeframe(tf); setIsDropdownOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-[10px] sm:text-xs hover:bg-white/5 ${timeframe === tf ? 'text-amber-300 font-bold bg-white/5' : 'text-gray-300'}`}
                                >
                                    {timeframeLabels[tf]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Played Games */}
            <div className="flex flex-col mb-5">
                <h4 className="text-[10px] font-bold tracking-widest uppercase text-center text-gray-500 mb-2">Played Games</h4>
                <div className="grid grid-cols-2 gap-2 sm:gap-4 px-2 sm:px-4">
                    {/* Home Team */}
                    <div className="flex items-center justify-between bg-white/5 rounded-xl border border-white/10 px-3 py-2 sm:px-4 sm:py-3">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 sm:w-6 sm:h-6 relative">
                                <Image src={homeTeam.logo} alt={homeTeam.name} fill className="object-contain filter drop-shadow-md" unoptimized />
                            </div>
                            <span className="text-[10px] sm:text-xs font-bold text-gray-300 truncate max-w-[60px] sm:max-w-[100px]">{homeTeam.name}</span>
                        </div>
                        <span className="text-lg sm:text-2xl font-bold text-white">{homeStats.played}</span>
                    </div>
                    {/* Away Team */}
                    <div className="flex items-center justify-between bg-white/5 rounded-xl border border-white/10 px-3 py-2 sm:px-4 sm:py-3">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 sm:w-6 sm:h-6 relative">
                                <Image src={awayTeam.logo} alt={awayTeam.name} fill className="object-contain filter drop-shadow-md" unoptimized />
                            </div>
                            <span className="text-[10px] sm:text-xs font-bold text-gray-300 truncate max-w-[60px] sm:max-w-[100px]">{awayTeam.name}</span>
                        </div>
                        <span className="text-lg sm:text-2xl font-bold text-white">{awayStats.played}</span>
                    </div>
                </div>
            </div>

            {/* Goals Panels */}
            <div className="flex flex-col mb-5">
                <h4 className="text-[10px] font-bold tracking-widest uppercase text-center text-gray-500 mb-2">Goals</h4>
                <div className="grid grid-cols-2 gap-2 sm:gap-4 px-2 sm:px-4">
                    
                    {/* Home Goals */}
                    <div className="flex flex-col bg-white/5 rounded-xl border border-white/10 p-3 sm:p-4">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-[10px] sm:text-xs font-bold text-gray-300 block mb-1">Scored</span>
                                <span className="text-2xl sm:text-3xl font-bold text-white">{homeStats.scored}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[9px] sm:text-[10px] text-gray-500 block mb-1">Avg. p/game</span>
                                <span className="text-base sm:text-lg font-bold text-gray-400">{homeStats.avgScored}</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[10px] sm:text-xs font-bold text-gray-300 block mb-1">Conceded</span>
                                <span className="text-2xl sm:text-3xl font-bold text-white">{homeStats.conceded}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[9px] sm:text-[10px] text-gray-500 block mb-1">Avg. p/game</span>
                                <span className="text-base sm:text-lg font-bold text-gray-400">{homeStats.avgConceded}</span>
                            </div>
                        </div>
                    </div>

                    {/* Away Goals */}
                    <div className="flex flex-col bg-white/5 rounded-xl border border-white/10 p-3 sm:p-4">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-[10px] sm:text-xs font-bold text-gray-300 block mb-1">Scored</span>
                                <span className="text-2xl sm:text-3xl font-bold text-white">{awayStats.scored}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[9px] sm:text-[10px] text-gray-500 block mb-1">Avg. p/game</span>
                                <span className="text-base sm:text-lg font-bold text-gray-400">{awayStats.avgScored}</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[10px] sm:text-xs font-bold text-gray-300 block mb-1">Conceded</span>
                                <span className="text-2xl sm:text-3xl font-bold text-white">{awayStats.conceded}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[9px] sm:text-[10px] text-gray-500 block mb-1">Avg. p/game</span>
                                <span className="text-base sm:text-lg font-bold text-gray-400">{awayStats.avgConceded}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scored a Goal Progress Bars */}
            <div className="flex flex-col mb-2">
                <div className="grid grid-cols-2 gap-2 sm:gap-4 px-2 sm:px-4">
                    {/* Home Scored a goal */}
                    <div className="flex flex-col">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-[9px] sm:text-[10px] text-gray-500">in last {homeStats.played} matches</span>
                            <span className="text-[10px] sm:text-xs font-bold text-gray-300">Scored a goal</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-gray-400 mb-1.5">
                            <span>Yes</span>
                            <span>No</span>
                        </div>
                        <div className="w-full h-1.5 sm:h-2 bg-red-500/80 rounded-full overflow-hidden mb-1.5 flex">
                            <div className="h-full bg-green-500" style={{ width: `${homeStats.scoredPercent}%` }} />
                        </div>
                        <div className="flex justify-between items-center text-[9px] sm:text-[10px] text-gray-300 font-medium">
                            <span>{homeStats.scoredMatches} ({homeStats.scoredPercent}%)</span>
                            <span>{homeStats.played - homeStats.scoredMatches} ({homeStats.failedPercent}%)</span>
                        </div>
                    </div>

                    {/* Away Scored a goal */}
                    <div className="flex flex-col">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-[10px] sm:text-xs font-bold text-gray-300 opacity-0">Scored a goal</span>
                            <span className="text-[9px] sm:text-[10px] text-gray-500">in last {awayStats.played} matches</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-gray-400 mb-1.5">
                            <span>Yes</span>
                            <span>No</span>
                        </div>
                        <div className="w-full h-1.5 sm:h-2 bg-red-500/80 rounded-full overflow-hidden mb-1.5 flex">
                            <div className="h-full bg-green-500" style={{ width: `${awayStats.scoredPercent}%` }} />
                        </div>
                        <div className="flex justify-between items-center text-[9px] sm:text-[10px] text-gray-300 font-medium">
                            <span>{awayStats.scoredMatches} ({awayStats.scoredPercent}%)</span>
                            <span>{awayStats.played - awayStats.scoredMatches} ({awayStats.failedPercent}%)</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default OverallStatistics;
