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

    const generateOverallStory = () => {
        if (!homeStats.played || !awayStats.played) return null;

        const homeScoredAvg = parseFloat(homeStats.avgScored);
        const awayScoredAvg = parseFloat(awayStats.avgScored);
        const homeConcededAvg = parseFloat(homeStats.avgConceded);
        const awayConcededAvg = parseFloat(awayStats.avgConceded);

        if (homeScoredAvg >= 2.0 && awayScoredAvg >= 2.0) {
            return `Offensive powerhouses: Both ${homeTeam.name} and ${awayTeam.name} are in formidable goal-scoring form, each averaging 2+ goals per game recently.`;
        } else if (homeConcededAvg <= 1.0 && awayConcededAvg <= 1.0) {
            return `Defensive solidity: Both teams boast strong backlines, conceding an average of 1 goal or less in their recent fixtures.`;
        } else if (homeScoredAvg >= awayScoredAvg + 0.8) {
            return `Attacking edge: ${homeTeam.name} has been significantly more potent in front of goal, averaging ${homeStats.avgScored} goals per game compared to ${awayTeam.name}'s ${awayStats.avgScored}.`;
        } else if (awayScoredAvg >= homeScoredAvg + 0.8) {
            return `Attacking edge: ${awayTeam.name} has been significantly more potent in front of goal, averaging ${awayStats.avgScored} goals per game compared to ${homeTeam.name}'s ${homeStats.avgScored}.`;
        } else {
            return `Balanced form: Both teams show comparable offensive form recently. ${homeTeam.name} scores an average of ${homeStats.avgScored} per game, while ${awayTeam.name} averages ${awayStats.avgScored}.`;
        }
    };

    const storyText = generateOverallStory();

    return (
        <div className="w-full mt-1 animate-in fade-in duration-500">
            <div className="flex justify-center mb-3">
                <h3 className="inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-1 bg-gray-100 backdrop-blur-sm border border-gray-300 text-teal-700 rounded-lg sm:rounded-xl text-[11px] font-bold shadow-lg tracking-wide uppercase">
                    Overall Statistics
                </h3>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
                <div className="flex bg-gray-100 rounded-full p-1 border border-gray-300">
                    <button
                        onClick={() => setLocationMode("overall")}
                        className={`px-4 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold transition-all ${locationMode === "overall" ? "bg-gray-300 text-teal-700 shadow-inner" : "text-gray-600 hover:text-gray-900"}`}
                    >
                        Overall
                    </button>
                    <button
                        onClick={() => setLocationMode("home_away")}
                        className={`px-4 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold transition-all ${locationMode === "home_away" ? "bg-gray-300 text-teal-700 shadow-inner" : "text-gray-600 hover:text-gray-900"}`}
                    >
                        Home/Away
                    </button>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 px-4 py-1.5 rounded-full text-[10px] sm:text-[11px] font-medium transition-all"
                    >
                        {timeframeLabels[timeframe]}
                        <span className="text-[8px]">▼</span>
                    </button>
                    
                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-1 w-32 bg-[#1A1A1A] border border-gray-300 rounded-xl shadow-xl overflow-hidden z-20">
                            {(["full", "first_half", "second_half"] as const).map(tf => (
                                <button
                                    key={tf}
                                    onClick={() => { setTimeframe(tf); setIsDropdownOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-[10px] sm:text-xs hover:bg-gray-100 ${timeframe === tf ? 'text-amber-300 font-bold bg-gray-100' : 'text-gray-700'}`}
                                >
                                    {timeframeLabels[tf]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Played Games */}
            <div className="flex flex-col mb-3">
                <h4 className="text-[10px] font-bold tracking-widest uppercase text-center text-gray-500 mb-1">Played Games</h4>
                <div className="grid grid-cols-2 gap-2 px-1 sm:px-2">
                    {/* Home Team */}
                    <div className="flex items-center justify-between px-1 py-1 sm:px-1.5 sm:py-1.5">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 sm:w-5 sm:h-5 relative">
                                <Image src={homeTeam.logo} alt={homeTeam.name} fill className="object-contain filter drop-shadow-md" unoptimized />
                            </div>
                            <span className="text-[9px] sm:text-[10px] font-bold text-gray-700 truncate max-w-[60px] sm:max-w-[100px]">{homeTeam.name}</span>
                        </div>
                        <span className="text-base sm:text-xl font-bold text-gray-900">{homeStats.played}</span>
                    </div>
                    {/* Away Team */}
                    <div className="flex items-center justify-between px-1 py-1 sm:px-1.5 sm:py-1.5">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 sm:w-5 sm:h-5 relative">
                                <Image src={awayTeam.logo} alt={awayTeam.name} fill className="object-contain filter drop-shadow-md" unoptimized />
                            </div>
                            <span className="text-[9px] sm:text-[10px] font-bold text-gray-700 truncate max-w-[60px] sm:max-w-[100px]">{awayTeam.name}</span>
                        </div>
                        <span className="text-base sm:text-xl font-bold text-gray-900">{awayStats.played}</span>
                    </div>
                </div>
            </div>

            {/* Goals Panels */}
            <div className="flex flex-col mb-3">
                <h4 className="text-[10px] font-bold tracking-widest uppercase text-center text-gray-500 mb-1">Goals</h4>
                <div className="grid grid-cols-2 gap-2 px-1 sm:px-2">
                    
                    {/* Home Goals */}
                    <div className="flex flex-col p-1 sm:p-1.5">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <span className="text-[9px] sm:text-[10px] font-bold text-gray-700 block mb-1">Scored</span>
                                <span className="text-xl sm:text-2xl font-bold text-gray-900">{homeStats.scored}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[8px] sm:text-[9px] text-gray-500 block mb-1">Avg. p/game</span>
                                <span className="text-sm sm:text-base font-bold text-gray-600">{homeStats.avgScored}</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[9px] sm:text-[10px] font-bold text-gray-700 block mb-1">Conceded</span>
                                <span className="text-xl sm:text-2xl font-bold text-gray-900">{homeStats.conceded}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[8px] sm:text-[9px] text-gray-500 block mb-1">Avg. p/game</span>
                                <span className="text-sm sm:text-base font-bold text-gray-600">{homeStats.avgConceded}</span>
                            </div>
                        </div>
                    </div>

                    {/* Away Goals */}
                    <div className="flex flex-col p-1 sm:p-1.5">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <span className="text-[9px] sm:text-[10px] font-bold text-gray-700 block mb-1">Scored</span>
                                <span className="text-xl sm:text-2xl font-bold text-gray-900">{awayStats.scored}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[8px] sm:text-[9px] text-gray-500 block mb-1">Avg. p/game</span>
                                <span className="text-sm sm:text-base font-bold text-gray-600">{awayStats.avgScored}</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[9px] sm:text-[10px] font-bold text-gray-700 block mb-1">Conceded</span>
                                <span className="text-xl sm:text-2xl font-bold text-gray-900">{awayStats.conceded}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[8px] sm:text-[9px] text-gray-500 block mb-1">Avg. p/game</span>
                                <span className="text-sm sm:text-base font-bold text-gray-600">{awayStats.avgConceded}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scored a Goal Progress Bars */}
            <div className="flex flex-col mb-1">
                <div className="grid grid-cols-2 gap-2 px-1 sm:px-2">
                    {/* Home Scored a goal */}
                    <div className="flex flex-col">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-[9px] sm:text-[10px] text-gray-500">in last {homeStats.played} matches</span>
                            <span className="text-[9px] sm:text-[10px] font-bold text-gray-700">Scored a goal</span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-bold text-gray-600 mb-1.5">
                            <span>Yes</span>
                            <span>No</span>
                        </div>
                        <div className="w-full h-1.5 sm:h-2 bg-red-500/80 rounded-full overflow-hidden mb-1.5 flex">
                            <div className="h-full bg-green-500" style={{ width: `${homeStats.scoredPercent}%` }} />
                        </div>
                        <div className="flex justify-between items-center text-[9px] sm:text-[10px] text-gray-700 font-medium">
                            <span>{homeStats.scoredMatches} ({homeStats.scoredPercent}%)</span>
                            <span>{homeStats.played - homeStats.scoredMatches} ({homeStats.failedPercent}%)</span>
                        </div>
                    </div>

                    {/* Away Scored a goal */}
                    <div className="flex flex-col">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-[9px] sm:text-[10px] font-bold text-gray-700 opacity-0">Scored a goal</span>
                            <span className="text-[9px] sm:text-[10px] text-gray-500">in last {awayStats.played} matches</span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-bold text-gray-600 mb-1.5">
                            <span>Yes</span>
                            <span>No</span>
                        </div>
                        <div className="w-full h-1.5 sm:h-2 bg-red-500/80 rounded-full overflow-hidden mb-1.5 flex">
                            <div className="h-full bg-green-500" style={{ width: `${awayStats.scoredPercent}%` }} />
                        </div>
                        <div className="flex justify-between items-center text-[9px] sm:text-[10px] text-gray-700 font-medium">
                            <span>{awayStats.scoredMatches} ({awayStats.scoredPercent}%)</span>
                            <span>{awayStats.played - awayStats.scoredMatches} ({awayStats.failedPercent}%)</span>
                        </div>
                    </div>
                </div>
            </div>

            {storyText && (
                <div className="mt-2 sm:mt-3 bg-gray-100 rounded-xl p-1 sm:p-1.5 shadow-sm flex items-start gap-2">
                    <p className="text-[10px] sm:text-[11px] font-medium text-gray-700 leading-relaxed text-justify">
                        {storyText}
                    </p>
                </div>
            )}

        </div>
    );
};

export default OverallStatistics;
