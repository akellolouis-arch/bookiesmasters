
import React, { useState } from "react";

interface LastMatch {
    date: string;
    homeTeam: { name: string; logo?: string };
    awayTeam: { name: string; logo?: string };
    score: { home: number; away: number };
    result: "W" | "L" | "D";
    color: string;
    league?: { id: number; name: string; logo?: string };
}

interface LastFiveMatchesProps {
    teamLogo?: string;
    teamName: string;
    matches: LastMatch[]; // Now contains 20 matches
    subTitle?: string;
}

const LastFiveMatches: React.FC<LastFiveMatchesProps> = ({ teamLogo, teamName, matches, subTitle }) => {
    const [showAll, setShowAll] = useState(false);
    const [activeLeagueId, setActiveLeagueId] = useState<number | "All">("All");

    if (!matches || matches.length === 0) {
        return (
            <div className="mb-4 w-full text-center">
                <div className="text-gray-500 text-xs uppercase tracking-widest mb-2">{teamName}</div>
                <div className="text-sm text-gray-400">No match history available</div>
            </div>
        );
    }

    // Extract unique leagues
    const uniqueLeagues = Array.from(
        new Map(
            matches
                .filter(m => m.league)
                .map(m => [m.league!.id, m.league])
        ).values()
    ) as { id: number; name: string; logo?: string }[];

    // Filter matches by selected league
    const filteredMatches = activeLeagueId === "All" 
        ? matches 
        : matches.filter(m => m.league && m.league.id === activeLeagueId);

    // Determine matches to show: first 5 or all
    const visibleMatches = showAll ? filteredMatches : filteredMatches.slice(0, 5);
    const hasMore = filteredMatches.length > 5;

    // Calculate Form Summary
    const totalMatches = visibleMatches.length;
    let wins = 0, draws = 0, losses = 0;
    visibleMatches.forEach(m => {
        if (m.result === "W") wins++;
        else if (m.result === "D") draws++;
        else if (m.result === "L") losses++;
    });

    const winPct = totalMatches ? Math.round((wins / totalMatches) * 100) : 0;
    const drawPct = totalMatches ? Math.round((draws / totalMatches) * 100) : 0;
    const lossPct = totalMatches ? Math.round((losses / totalMatches) * 100) : 0;

    return (
        <div className="mb-2 w-full animate-in fade-in duration-500">
            {/* 🏆 Title + Team Logo */}
            <div className={`flex flex-col mb-2 border-b border-white/10 pb-1 items-start`}>
                <div className={`flex items-center gap-2 justify-start`}>
                    {teamLogo && (
                        <img
                            src={teamLogo}
                            alt={`${teamName} Logo`}
                            className="w-6 h-6 object-contain"
                        />
                    )}
                    <h4 className="text-xs font-bold text-emerald-200/70 tracking-wide capitalize">
                        {teamName} {subTitle && <span className="text-gray-400 font-normal ml-1">({subTitle})</span>}
                    </h4>
                </div>
            </div>

            {/* 🏷️ League Filter Tabs */}
            {uniqueLeagues.length > 0 && (
                <div className="flex items-center justify-start gap-1 mb-3 overflow-x-auto no-scrollbar pb-1 px-1">
                    <button
                        onClick={() => { setActiveLeagueId("All"); setShowAll(false); }}
                        className={`px-1 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                            activeLeagueId === "All"
                                ? "bg-white/20 text-white shadow-sm"
                                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                        }`}
                    >
                        All
                    </button>
                    {uniqueLeagues.map((league) => (
                        <button
                            key={league.id}
                            onClick={() => { setActiveLeagueId(league.id); setShowAll(false); }}
                            className={`px-1 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                                activeLeagueId === league.id
                                    ? "bg-white/20 text-white shadow-sm"
                                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200"
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
                    const matchDateObj = new Date(m.date);
                    const monthDay = matchDateObj.toLocaleDateString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                    });
                    const year = matchDateObj.getFullYear();

                    const isEven = i % 2 === 0;
                    const bgClass = isEven ? "bg-[#0A0A0A]" : "bg-[#1E1E1E]";
                    const hoverClass = isEven ? "hover:bg-[#151515]" : "hover:bg-[#282828]";

                    const homeWinner = m.score.home > m.score.away;
                    const awayWinner = m.score.away > m.score.home;

                    return (
                        <div
                            key={i}
                            className={`flex items-center p-2 text-sm transition-colors ${bgClass} ${hoverClass}`}
                        >
                            {/* 1️⃣ Date */}
                            <div className="flex flex-col items-center justify-center mr-2 w-10 shrink-0">
                                <span className="text-gray-500 text-[10px] font-medium leading-none mb-0.5">{monthDay}</span>
                                <span className="text-gray-600 text-[9px] leading-none">{year}</span>
                            </div>

                            {/* 2️⃣ Home Team */}
                            <div className="flex items-center justify-end gap-2 pr-3 min-w-0 flex-1">
                                <span className={`font-medium text-xs md:text-sm whitespace-normal break-words leading-tight text-right ${homeWinner ? 'text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]' : 'text-gray-200'}`}>{m.homeTeam.name}</span>
                                {m.homeTeam.logo && (
                                    <img src={m.homeTeam.logo} alt={m.homeTeam.name} className="w-5 h-5 object-contain flex-shrink-0" />
                                )}
                            </div>

                            {/* 3️⃣ Score with perspective-based badge */}
                            <div className="flex flex-col items-center justify-center shrink-0 w-14">
                                <span
                                    className="w-full text-center px-1.5 py-0.5 rounded font-bold text-[10px]"
                                    style={{ backgroundColor: m.color, color: m.result === "D" ? "#7c2d12" : (m.result === "W" ? "#14532d" : "#7f1d1d") }}
                                >
                                    {m.score.home} - {m.score.away}
                                </span>
                                {(m as any).score?.halftime && (m as any).score.halftime.home !== null && (m as any).score.halftime.away !== null && (
                                    <span className="text-[10px] text-gray-500 mt-0.5 font-medium tracking-wide">
                                        {(m as any).score.halftime.home}-{(m as any).score.halftime.away}
                                    </span>
                                )}
                            </div>

                            {/* 4️⃣ Away Team */}
                            <div className="flex items-center justify-start gap-2 pl-3 min-w-0 pr-1 flex-1">
                                {m.awayTeam.logo && (
                                    <img src={m.awayTeam.logo} alt={m.awayTeam.name} className="w-5 h-5 object-contain flex-shrink-0" />
                                )}
                                <span className={`font-medium text-xs md:text-sm whitespace-normal break-words leading-tight text-left ${awayWinner ? 'text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]' : 'text-gray-200'}`}>{m.awayTeam.name}</span>
                            </div>

                            {/* 5️⃣ League Short Name (Optional visual flair based on user reference) */}
                            {m.league && (
                                <div className="hidden sm:flex flex-col items-end justify-center w-8 shrink-0 opacity-40 ml-auto">
                                    <span className="text-[9px] font-bold tracking-wider uppercase whitespace-nowrap overflow-hidden text-ellipsis max-w-[40px]" title={m.league.name}>
                                        {m.league.name.substring(0, 3)}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* 📊 Form Summary */}
            {totalMatches > 0 && (
                <div className="mt-3 px-2 mb-2">
                    {/* Horizontal Progress Bar */}
                    <div className="w-full h-1.5 flex rounded-full overflow-hidden mb-3">
                        <div className="flex-1 bg-green-500 h-full" />
                        <div className="flex-1 bg-yellow-500 h-full" />
                        <div className="flex-1 bg-red-500 h-full" />
                    </div>
                    
                    {/* Stats Columns */}
                    <div className="flex justify-between text-center px-4 md:px-8">
                        {/* Win */}
                        <div className="flex flex-col items-center">
                            <span className="text-gray-200 text-xs font-bold mb-1">Win {wins}</span>
                            <span className="text-gray-400 text-xs mb-1">{winPct}%</span>
                            <div className="w-8 h-1 bg-green-500 rounded-full" />
                        </div>
                        {/* Draw */}
                        <div className="flex flex-col items-center">
                            <span className="text-gray-200 text-xs font-bold mb-1">Draw {draws}</span>
                            <span className="text-gray-400 text-xs mb-1">{drawPct}%</span>
                            <div className="w-8 h-1 bg-yellow-500 rounded-full" />
                        </div>
                        {/* Lost */}
                        <div className="flex flex-col items-center">
                            <span className="text-gray-200 text-xs font-bold mb-1">Lost {losses}</span>
                            <span className="text-gray-400 text-xs mb-1">{lossPct}%</span>
                            <div className="w-8 h-1 bg-red-500 rounded-full" />
                        </div>
                    </div>
                </div>
            )}

            {/* Show More Button */}
            {(hasMore || showAll) && (
                <div className="flex justify-center mt-3 mb-1">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="px-4 py-1.5 text-[10px] sm:text-xs font-bold text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white rounded-full transition-all"
                    >
                        {showAll ? "View less" : "View all"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default LastFiveMatches;
