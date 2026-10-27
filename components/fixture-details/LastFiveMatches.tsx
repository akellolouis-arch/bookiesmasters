"use client";

import React, { useState } from "react";

interface LastMatch {
    date?: string;
    homeTeam?: { name?: string; logo?: string };
    awayTeam?: { name?: string; logo?: string };
    score?: { home?: number | null; away?: number | null };
    result?: "W" | "L" | "D" | string;
    color?: string;
    league?: { id?: number; name?: string; logo?: string };
}

interface LastFiveMatchesProps {
    teamLogo?: string;
    teamName: string;
    matches: LastMatch[];
    subTitle?: string;
}

const LastFiveMatches: React.FC<LastFiveMatchesProps> = ({ teamLogo, teamName, matches, subTitle }) => {
    const [showAll, setShowAll] = useState(false);
    const [activeLeagueId, setActiveLeagueId] = useState<number | "All">("All");

    if (!matches || !Array.isArray(matches) || matches.length === 0) {
        return (
            <div className="mb-4 w-full text-center">
                <div className="text-gray-500 text-xs uppercase tracking-widest mb-2">{teamName}</div>
                <div className="text-sm text-gray-600">No match history available</div>
            </div>
        );
    }

    const safeMatches = matches.filter(Boolean);

    // Extract unique leagues safely
    const uniqueLeagues = Array.from(
        new Map(
            safeMatches
                .filter(m => m?.league?.id && m?.league?.name)
                .map(m => [m.league!.id, m.league])
        ).values()
    ) as { id: number; name: string; logo?: string }[];

    // Filter matches by selected league
    const filteredMatches = activeLeagueId === "All" 
        ? safeMatches 
        : safeMatches.filter(m => m?.league && m.league.id === activeLeagueId);

    // Determine matches to show: first 5 or all
    const visibleMatches = showAll ? filteredMatches : filteredMatches.slice(0, 5);
    const hasMore = filteredMatches.length > 5;

    return (
        <div className="mb-2 w-full animate-in fade-in duration-500">
            {/* 🏷️ League Filter Tabs */}
            {uniqueLeagues.length > 0 && (
                <div className="flex items-center justify-start gap-1 mb-3 overflow-x-auto no-scrollbar pb-1 px-1">
                    <button
                        onClick={() => { setActiveLeagueId("All"); setShowAll(false); }}
                        className={`px-1 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                            activeLeagueId === "All"
                                ? "bg-gray-300 text-gray-900 shadow-sm"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
                        }`}
                    >
                        All
                    </button>
                    {uniqueLeagues.map((league) => (
                        <button
                            key={league.id}
                            onClick={() => { setActiveLeagueId(league.id); setShowAll(false); }}
                            className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                                activeLeagueId === league.id
                                    ? "bg-gray-300 text-gray-900 shadow-sm"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
                            }`}
                        >
                            {league.name}
                        </button>
                    ))}
                </div>
            )}

            {/* 🏟️ Matches List */}
            <div className="flex flex-col">
                {visibleMatches.map((m, i) => {
                    let monthDay = "";
                    let year = "";
                    try {
                        if (m?.date) {
                            const matchDateObj = new Date(m.date);
                            if (!isNaN(matchDateObj.getTime())) {
                                monthDay = matchDateObj.toLocaleDateString("en-US", {
                                    month: "2-digit",
                                    day: "2-digit",
                                });
                                year = String(matchDateObj.getFullYear());
                            }
                        }
                    } catch {
                        // ignore
                    }

                    const isEven = i % 2 === 0;
                    const bgClass = isEven ? "bg-gray-50" : "bg-white";
                    const hoverClass = isEven ? "hover:bg-[#151515]" : "hover:bg-[#282828]";

                    const homeScore = m?.score?.home ?? "-";
                    const awayScore = m?.score?.away ?? "-";
                    const homeWinner = typeof homeScore === "number" && typeof awayScore === "number" && homeScore > awayScore;
                    const awayWinner = typeof homeScore === "number" && typeof awayScore === "number" && awayScore > homeScore;
                    const homeName = m?.homeTeam?.name || "Home";
                    const awayName = m?.awayTeam?.name || "Away";

                    return (
                        <div
                            key={i}
                            className={`flex items-center py-1 px-2 text-sm transition-colors ${bgClass} ${hoverClass}`}
                        >
                            {/* 1️⃣ Date */}
                            <div className="flex flex-col items-center justify-center mr-2 w-10 shrink-0">
                                <span className="text-gray-500 text-[11px] font-medium leading-none mb-0.5">{monthDay}</span>
                                <span className="text-gray-600 text-[10px] leading-none">{year}</span>
                            </div>

                            {/* 2️⃣ Home Team */}
                            <div className="flex items-center justify-end gap-1.5 flex-1 min-w-0 pr-3">
                                <span className={`font-medium text-[11px] sm:text-[12px] truncate text-right px-1 ${homeWinner ? 'text-gray-900 drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]' : 'text-gray-800'}`}>{homeName}</span>
                                {m?.homeTeam?.logo && (
                                    <img src={m.homeTeam.logo} alt={homeName} className="w-4 h-4 object-contain flex-shrink-0" />
                                )}
                            </div>

                            {/* 3️⃣ Score with perspective-based badge */}
                            <div className="flex flex-col items-center justify-center shrink-0 w-14">
                                <span
                                    className="w-full text-center px-1.5 py-0.5 rounded font-bold text-[10px] sm:text-[11px]"
                                    style={{ backgroundColor: m?.color || "#e5e7eb", color: m?.result === "D" ? "#7c2d12" : (m?.result === "W" ? "#14532d" : "#7f1d1d") }}
                                >
                                    {homeScore} - {awayScore}
                                </span>
                                {(m as any)?.score?.halftime && (m as any).score.halftime.home !== null && (m as any).score.halftime.away !== null && (
                                    <span className="text-[11px] text-gray-500 mt-0.5 font-medium tracking-wide">
                                        {(m as any).score.halftime.home}-{(m as any).score.halftime.away}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center justify-start gap-1.5 min-w-0 pl-3 pr-1 flex-1">
                                {m?.awayTeam?.logo && (
                                    <img src={m.awayTeam.logo} alt={awayName} className="w-4 h-4 object-contain flex-shrink-0" />
                                )}
                                <span className={`font-medium text-[11px] sm:text-[12px] truncate text-left px-1 ${awayWinner ? 'text-gray-900 drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]' : 'text-gray-800'}`}>{awayName}</span>
                            </div>

                            {/* 5️⃣ League Short Name */}
                            {m?.league?.name && (
                                <div className="hidden sm:flex flex-col items-end justify-center w-8 shrink-0 opacity-40 ml-auto">
                                    <span className="text-[10px] font-bold tracking-wider uppercase whitespace-nowrap overflow-hidden text-ellipsis max-w-[40px]" title={m.league.name}>
                                        {m.league.name.substring(0, 3)}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Show More Button */}
            {(hasMore || showAll) && (
                <div className="flex justify-center mt-3 mb-1">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="px-4 py-1.5 text-[10px] sm:text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 rounded-full transition-all cursor-pointer"
                    >
                        {showAll ? "View less" : "View all"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default LastFiveMatches;
