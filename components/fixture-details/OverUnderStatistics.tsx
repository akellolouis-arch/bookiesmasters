"use client";

import React from "react";
import Image from "next/image";
import PieChart from "./PieChart";

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

const OverUnderStatistics: React.FC<TeamStatsProps> = ({ homeTeam, awayTeam }) => {
    
    // Helper to calculate stats for a specific goal line
    const calculateLineStats = (matches: any[] | undefined, line: number) => {
        let over = 0;
        let under = 0;

        if (!matches || !Array.isArray(matches)) {
            return { over: 0, under: 0, overPct: 0, underPct: 0, total: 0 };
        }

        matches.forEach(m => {
            // Only count finished matches (FT, AET, PEN) - but formCalculator already returns completed
            const homeScore = m.score?.home;
            const awayScore = m.score?.away;

            if (homeScore !== undefined && awayScore !== undefined && homeScore !== null && awayScore !== null) {
                const totalGoals = homeScore + awayScore;
                if (totalGoals > line) {
                    over++;
                } else {
                    under++;
                }
            }
        });

        const total = over + under;
        const overPct = total ? Math.round((over / total) * 100) : 0;
        const underPct = total ? Math.round((under / total) * 100) : 0;

        return { over, under, overPct, underPct, total };
    };

    const lines = [1.5, 2.5, 3.5];

    const generateOverUnderStory = () => {
        const home25 = calculateLineStats(homeTeam.allMatches, 2.5);
        const away25 = calculateLineStats(awayTeam.allMatches, 2.5);

        if (!home25.total || !away25.total) return null;

        const avgOver25 = (home25.overPct + away25.overPct) / 2;

        if (avgOver25 >= 70) {
            return `Expect goals: Over 2.5 goals has hit in a combined ${Math.round(avgOver25)}% of recent matches for these teams, signaling a high-scoring affair.`;
        } else if (avgOver25 <= 35) {
            return `Tight game expected: Under 2.5 goals occurred in the vast majority of recent games for both ${homeTeam.name} and ${awayTeam.name}.`;
        } else if (home25.overPct >= 70 && away25.overPct < 50) {
            return `Contrasting styles: ${homeTeam.name} frequently sees Over 2.5 goals (${home25.overPct}%), while ${awayTeam.name} tends to play lower-scoring games.`;
        } else if (away25.overPct >= 70 && home25.overPct < 50) {
            return `Contrasting styles: ${awayTeam.name} frequently sees Over 2.5 goals (${away25.overPct}%), while ${homeTeam.name} tends to play lower-scoring games.`;
        } else {
            return `Over 2.5 goals has hit in ${home25.overPct}% of ${homeTeam.name}'s recent games and ${away25.overPct}% of ${awayTeam.name}'s.`;
        }
    };

    const storyText = generateOverUnderStory();

    return (
        <div className="w-full mt-1 animate-in fade-in duration-500">
            
            {/* Header / Legend */}
            <div className="flex justify-end items-center mb-2 gap-3 px-1">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-slate-500 shadow-sm"></div>
                    <span className="text-[11px] sm:text-xs text-gray-900 font-medium tracking-wide">Under</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-slate-800 border border-gray-300 shadow-sm"></div>
                    <span className="text-[11px] sm:text-xs text-gray-600 font-medium tracking-wide">Over</span>
                </div>
            </div>

            {/* Teams Header Row */}
            <div className="flex justify-between items-center mb-2 px-1 sm:px-2">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] sm:text-[12px] font-bold text-gray-900 uppercase truncate max-w-[60px] sm:max-w-[100px]">{homeTeam.name}</span>
                    <div className="w-5 h-5 sm:w-6 sm:h-6 relative filter drop-shadow-md bg-gray-100 rounded-full p-0.5">
                        <Image src={homeTeam.logo} alt={homeTeam.name} fill className="object-contain" unoptimized />
                    </div>
                </div>
                <div className="text-xs sm:text-sm font-bold text-teal-700/80 tracking-wide uppercase">
                    
                </div>
                <div className="flex items-center gap-2 flex-row-reverse">
                    <span className="text-[11px] sm:text-[12px] font-bold text-gray-900 uppercase truncate max-w-[60px] sm:max-w-[100px]">{awayTeam.name}</span>
                    <div className="w-5 h-5 sm:w-6 sm:h-6 relative filter drop-shadow-md bg-gray-100 rounded-full p-0.5">
                        <Image src={awayTeam.logo} alt={awayTeam.name} fill className="object-contain" unoptimized />
                    </div>
                </div>
            </div>

            {/* Goal Lines */}
            <div className="flex flex-col gap-2">
                {lines.map((line, index) => {
                    const homeStats = calculateLineStats(homeTeam.allMatches, line);
                    const awayStats = calculateLineStats(awayTeam.allMatches, line);

                    return (
                        <div key={line} className={`flex justify-between items-center px-1 sm:px-2 relative ${index !== lines.length - 1 ? 'border-b border-gray-200 pb-2' : ''}`}>
                            
                            {/* HOME STATS */}
                            <div className="flex flex-col items-center w-24 sm:w-32">
                                <div className="text-[10px] sm:text-[11px] font-bold tracking-wide mb-1">
                                    <span className="text-[#64748b]">Under</span>
                                    <span className="text-gray-900/30 mx-0.5">/</span>
                                    <span className="text-[#1e293b]">Over</span>
                                </div>
                                <div className="flex gap-3 sm:gap-4 text-[12px] sm:text-sm font-bold mb-2">
                                    <span className="text-slate-400">{homeStats.under}</span>
                                    <span className="text-gray-900">{homeStats.over}</span>
                                </div>
                                {/* Pie Chart */}
                                <PieChart 
                                    val1={homeStats.underPct} 
                                    color1="#64748b" 
                                    val2={homeStats.overPct} 
                                    color2="#1e293b" 
                                />
                            </div>

                            {/* CENTER LINE */}
                            <div className="flex flex-col items-center justify-center">
                                <span className="text-xl sm:text-2xl font-light text-gray-900 mb-1">{line}</span>
                                <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium tracking-widest uppercase">Goals</span>
                            </div>

                            {/* AWAY STATS */}
                            <div className="flex flex-col items-center w-24 sm:w-32">
                                <div className="text-[10px] sm:text-[11px] font-bold tracking-wide mb-1">
                                    <span className="text-[#64748b]">Under</span>
                                    <span className="text-gray-900/30 mx-0.5">/</span>
                                    <span className="text-[#1e293b]">Over</span>
                                </div>
                                <div className="flex gap-3 sm:gap-4 text-[12px] sm:text-sm font-bold mb-2">
                                    <span className="text-slate-400">{awayStats.under}</span>
                                    <span className="text-gray-900">{awayStats.over}</span>
                                </div>
                                {/* Pie Chart */}
                                <PieChart 
                                    val1={awayStats.underPct} 
                                    color1="#64748b" 
                                    val2={awayStats.overPct} 
                                    color2="#1e293b" 
                                />
                            </div>
                            
                        </div>
                    );
                })}
            </div>
            
            {/* Expert Insight Story */}
            {storyText && (
                <div className="mt-2 bg-gray-100 rounded-xl p-1 sm:p-1.5 shadow-sm flex items-start gap-2">
                    <p className="text-[11px] sm:text-xs font-medium text-gray-700 leading-relaxed text-justify">
                        {storyText}
                    </p>
                </div>
            )}

        </div>
    );
};

export default OverUnderStatistics;
