"use client";

import React from "react";
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

const BTTSStatistics: React.FC<TeamStatsProps> = ({ homeTeam, awayTeam }) => {
    
    const calculateBTTSStats = (matches: any[] | undefined) => {
        let yes = 0;
        let no = 0;

        if (!matches || !Array.isArray(matches)) {
            return { yes: 0, no: 0, yesPct: 0, noPct: 0, total: 0 };
        }

        matches.forEach(m => {
            const homeScore = m.score?.home;
            const awayScore = m.score?.away;

            if (homeScore !== undefined && awayScore !== undefined && homeScore !== null && awayScore !== null) {
                if (homeScore > 0 && awayScore > 0) {
                    yes++;
                } else {
                    no++;
                }
            }
        });

        const total = yes + no;
        const yesPct = total ? Math.round((yes / total) * 100) : 0;
        const noPct = total ? Math.round((no / total) * 100) : 0;

        return { yes, no, yesPct, noPct, total };
    };

    const homeStats = calculateBTTSStats(homeTeam.allMatches);
    const awayStats = calculateBTTSStats(awayTeam.allMatches);

    const generateBTTSStory = () => {
        if (!homeStats.total || !awayStats.total) return null;
        
        const avgYes = (homeStats.yesPct + awayStats.yesPct) / 2;
        
        if (avgYes >= 70) {
            return `High probability of goals: Both teams have scored in a combined average of ${Math.round(avgYes)}% of their recent matches.`;
        } else if (avgYes <= 35) {
            return `A clean sheet is likely: Both Teams to Score has failed to hit in the majority of recent games for both ${homeTeam.name} and ${awayTeam.name}.`;
        } else if (homeStats.yesPct >= 70 && awayStats.yesPct < 50) {
            return `${homeTeam.name} frequently sees goals at both ends (${homeStats.yesPct}%), but ${awayTeam.name} tends to be involved in one-sided affairs.`;
        } else if (awayStats.yesPct >= 70 && homeStats.yesPct < 50) {
            return `${awayTeam.name} frequently sees goals at both ends (${awayStats.yesPct}%), but ${homeTeam.name} tends to be involved in one-sided affairs.`;
        } else {
            return `Mixed indicators: Both teams have scored in ${homeStats.yesPct}% of ${homeTeam.name}'s recent games and ${awayStats.yesPct}% of ${awayTeam.name}'s.`;
        }
    };

    const storyText = generateBTTSStory();

    return (
        <div className="w-full mt-2 animate-in fade-in duration-500 bg-[#0F0F0F] rounded-2xl p-4 sm:p-6 border border-white/10 shadow-lg">
            
            <h3 className="text-xs sm:text-sm font-bold tracking-wide text-center text-white mb-6">
                Both scored (Yes/No)
            </h3>

            <div className="flex justify-between items-center sm:justify-around px-2 sm:px-10">
                
                {/* HOME STATS */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex flex-col items-end mr-1">
                        <span className="text-[10px] sm:text-xs font-bold text-white mb-0.5">Yes</span>
                        <span className="text-xs sm:text-sm font-bold text-green-500">{homeStats.yes}</span>
                    </div>

                    {/* Pie Chart */}
                    <PieChart 
                        val1={homeStats.noPct} 
                        color1="#ef4444" 
                        val2={homeStats.yesPct} 
                        color2="#22c55e" 
                    />

                    <div className="flex flex-col items-start ml-1">
                        <span className="text-[10px] sm:text-xs font-bold text-white mb-0.5">No</span>
                        <span className="text-xs sm:text-sm font-bold text-red-500">{homeStats.no}</span>
                    </div>
                </div>

                {/* AWAY STATS */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex flex-col items-end mr-1">
                        <span className="text-[10px] sm:text-xs font-bold text-green-500 mb-0.5">Yes</span>
                        <span className="text-xs sm:text-sm font-bold text-white">{awayStats.yes}</span>
                    </div>

                    {/* Pie Chart */}
                    <PieChart 
                        val1={awayStats.noPct} 
                        color1="#ef4444" 
                        val2={awayStats.yesPct} 
                        color2="#22c55e" 
                    />

                    <div className="flex flex-col items-start ml-1">
                        <span className="text-[10px] sm:text-xs font-bold text-red-500 mb-0.5">No</span>
                        <span className="text-xs sm:text-sm font-bold text-white">{awayStats.no}</span>
                    </div>
                </div>

            </div>

            {/* Expert Insight Story */}
            {storyText && (
                <div className="mt-6 sm:mt-8 bg-white/5 rounded-xl p-3 sm:p-4 shadow-sm flex items-start gap-3">
                    <p className="text-[10px] sm:text-[11px] font-medium italic text-gray-300 leading-relaxed">
                        {storyText}
                    </p>
                </div>
            )}
            
        </div>
    );
};

export default BTTSStatistics;
