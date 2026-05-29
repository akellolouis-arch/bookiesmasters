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
        <div className="w-full mt-4 animate-in fade-in duration-500 bg-[#0F0F0F] rounded-2xl p-3 sm:p-5 border border-white/10 shadow-lg">
            
            {/* Header / Legend */}
            <div className="flex justify-end items-center mb-4 gap-4 px-2">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-slate-500 shadow-sm"></div>
                    <span className="text-xs text-white font-medium tracking-wide">Under</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-slate-800 border border-white/10 shadow-sm"></div>
                    <span className="text-xs text-gray-400 font-medium tracking-wide">Over</span>
                </div>
            </div>

            {/* Teams Header Row */}
            <div className="flex justify-between items-center mb-6 px-2 sm:px-6">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] sm:text-sm font-bold text-white uppercase truncate max-w-[60px] sm:max-w-[100px]">{homeTeam.name}</span>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 relative filter drop-shadow-md bg-white/5 rounded-full p-0.5">
                        <Image src={homeTeam.logo} alt={homeTeam.name} fill className="object-contain" unoptimized />
                    </div>
                </div>
                <div className="text-xs sm:text-sm font-bold text-amber-100/80 tracking-wide uppercase">
                    
                </div>
                <div className="flex items-center gap-2 flex-row-reverse">
                    <span className="text-[11px] sm:text-sm font-bold text-white uppercase truncate max-w-[60px] sm:max-w-[100px]">{awayTeam.name}</span>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 relative filter drop-shadow-md bg-white/5 rounded-full p-0.5">
                        <Image src={awayTeam.logo} alt={awayTeam.name} fill className="object-contain" unoptimized />
                    </div>
                </div>
            </div>

            {/* Goal Lines */}
            <div className="flex flex-col gap-6 sm:gap-8">
                {lines.map((line, index) => {
                    const homeStats = calculateLineStats(homeTeam.allMatches, line);
                    const awayStats = calculateLineStats(awayTeam.allMatches, line);

                    return (
                        <div key={line} className={`flex justify-between items-center px-1 sm:px-6 relative ${index !== lines.length - 1 ? 'border-b border-white/5 pb-6 sm:pb-8' : ''}`}>
                            
                            {/* HOME STATS */}
                            <div className="flex flex-col items-center w-24 sm:w-32">
                                <div className="text-[11px] sm:text-sm font-bold tracking-wide mb-1">
                                    <span className="text-slate-400">Under</span>
                                    <span className="text-white/30 mx-0.5">/</span>
                                    <span className="text-white">Over</span>
                                </div>
                                <div className="flex gap-4 sm:gap-6 text-sm sm:text-base font-bold mb-3">
                                    <span className="text-slate-400">{homeStats.under}</span>
                                    <span className="text-white">{homeStats.over}</span>
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
                                <span className="text-2xl sm:text-4xl font-light text-white mb-1">{line}</span>
                                <span className="text-[10px] sm:text-xs text-gray-500 font-medium tracking-widest uppercase">Goals</span>
                            </div>

                            {/* AWAY STATS */}
                            <div className="flex flex-col items-center w-24 sm:w-32">
                                <div className="text-[11px] sm:text-sm font-bold tracking-wide mb-1">
                                    <span className="text-slate-400">Under</span>
                                    <span className="text-white/30 mx-0.5">/</span>
                                    <span className="text-white">Over</span>
                                </div>
                                <div className="flex gap-4 sm:gap-6 text-sm sm:text-base font-bold mb-3">
                                    <span className="text-slate-400">{awayStats.under}</span>
                                    <span className="text-white">{awayStats.over}</span>
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
                <div className="mt-4 sm:mt-6 bg-white/5 rounded-xl p-3 sm:p-4 shadow-sm flex items-start gap-3">
                    <p className="text-[11px] sm:text-xs font-medium italic text-gray-300 leading-relaxed">
                        {storyText}
                    </p>
                </div>
            )}

        </div>
    );
};

export default OverUnderStatistics;
