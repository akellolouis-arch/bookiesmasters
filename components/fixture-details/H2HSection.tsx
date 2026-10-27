"use client";

import React from "react";

interface MatchTeam {
    id?: number;
    name?: string;
    logo?: string;
    winner?: boolean | null;
}

interface MatchGoals {
    home?: number | null;
    away?: number | null;
}

interface H2HMatch {
    fixture?: {
        id?: number;
        date?: string;
        status?: { short?: string; long?: string };
    };
    teams?: {
        home?: MatchTeam;
        away?: MatchTeam;
    };
    goals?: MatchGoals;
    score?: {
        halftime?: MatchGoals;
        fulltime?: MatchGoals;
    };
}

interface H2HSectionProps {
    h2h: H2HMatch[];
}

const H2HSection: React.FC<H2HSectionProps> = ({ h2h }) => {
    if (!h2h || !Array.isArray(h2h) || h2h.length === 0)
        return <p className="text-center text-gray-600 mb-6">No H2H data available</p>;

    const validMatches = h2h.filter(Boolean);
    if (validMatches.length === 0)
        return <p className="text-center text-gray-600 mb-6">No H2H data available</p>;

    const visibleMatches = validMatches.slice(0, 5);

    // Calculate Stats
    const teamA = validMatches[0]?.teams?.home?.name || "Home";
    const teamB = validMatches[0]?.teams?.away?.name || "Away";

    let teamAWins = 0;
    let teamBWins = 0;
    let draws = 0;

    visibleMatches.forEach(match => {
        const homeGoals = match?.goals?.home;
        const awayGoals = match?.goals?.away;
        if (homeGoals !== undefined && homeGoals !== null && awayGoals !== undefined && awayGoals !== null) {
            if (homeGoals === awayGoals) {
                draws++;
            } else if (homeGoals > awayGoals) {
                if (match?.teams?.home?.name === teamA) teamAWins++;
                else teamBWins++;
            } else if (awayGoals > homeGoals) {
                if (match?.teams?.away?.name === teamA) teamAWins++;
                else teamBWins++;
            }
        }
    });

    return (
        <div className="mb-2 w-full animate-in fade-in duration-500">
            <div className="flex flex-col">
                {visibleMatches.map((match, i) => {
                    let monthDay = "";
                    let year = "";
                    try {
                        if (match?.fixture?.date) {
                            const matchDateObj = new Date(match.fixture.date);
                            if (!isNaN(matchDateObj.getTime())) {
                                monthDay = matchDateObj.toLocaleDateString("en-US", {
                                    month: "2-digit",
                                    day: "2-digit",
                                });
                                year = String(matchDateObj.getFullYear());
                            }
                        }
                    } catch {
                        // ignore date format error
                    }

                    const isEven = i % 2 === 0;
                    const bgClass = isEven ? "bg-gray-50" : "bg-white";
                    const hoverClass = isEven ? "hover:bg-[#151515]" : "hover:bg-[#282828]";

                    const homeName = match?.teams?.home?.name || "Home";
                    const awayName = match?.teams?.away?.name || "Away";
                    const homeWinner = Boolean(match?.teams?.home?.winner);
                    const awayWinner = Boolean(match?.teams?.away?.winner);
                    const homeG = match?.goals?.home ?? "-";
                    const awayG = match?.goals?.away ?? "-";

                    return (
                        <div
                            key={match?.fixture?.id || i}
                            className={`grid grid-cols-[auto_1fr_auto_1fr] md:grid-cols-4 items-center py-1 px-2 text-sm transition-colors ${bgClass} ${hoverClass}`}
                        >
                            {/* 1️⃣ Date */}
                            <div className="flex flex-col items-center justify-center mr-2 w-10 shrink-0">
                                <span className="text-gray-500 text-[11px] font-medium leading-none mb-0.5">{monthDay}</span>
                                <span className="text-gray-600 text-[10px] leading-none">{year}</span>
                            </div>

                            {/* 2️⃣ Home Team */}
                            <div className={`font-medium text-[11px] sm:text-[12px] truncate text-right px-1 pr-3 flex-1 min-w-0 ${homeWinner ? 'text-gray-900 drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]' : 'text-gray-800'}`}>
                                {homeName}
                            </div>

                            {/* 3️⃣ Score */}
                            <div className="flex flex-col items-center justify-center shrink-0 w-14">
                                <div className="flex justify-center w-full font-bold text-gray-900 bg-gray-50/40 px-2 py-0.5 rounded text-[10px] sm:text-[11px]">
                                    {homeG} - {awayG}
                                </div>
                                {match?.score?.halftime && match.score.halftime.home !== null && match.score.halftime.away !== null && (
                                    <span className="text-[11px] text-gray-500 mt-0.5 font-medium tracking-wide">
                                        {match.score.halftime.home}-{match.score.halftime.away}
                                    </span>
                                )}
                            </div>

                            {/* 4️⃣ Away Team */}
                            <div className={`font-medium text-[11px] sm:text-[12px] truncate text-left px-1 pl-3 flex-1 min-w-0 ${awayWinner ? 'text-gray-900 drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]' : 'text-gray-800'}`}>
                                {awayName}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default H2HSection;
