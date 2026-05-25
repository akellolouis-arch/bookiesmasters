
import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface LastMatch {
    date: string;
    homeTeam: { name: string; logo?: string };
    awayTeam: { name: string; logo?: string };
    score: { home: number; away: number };
    result: "W" | "L" | "D";
    color: string;
}

interface LastFiveMatchesProps {
    teamLogo?: string;
    teamName: string;
    matches: LastMatch[]; // Now contains 20 matches
}

const LastFiveMatches: React.FC<LastFiveMatchesProps> = ({ teamLogo, teamName, matches }) => {
    const [showAll, setShowAll] = useState(false);

    if (!matches || matches.length === 0) {
        return (
            <div className="mb-4 w-full text-center">
                <div className="text-gray-500 text-xs uppercase tracking-widest mb-2">{teamName}</div>
                <div className="text-sm text-gray-400">No match history available</div>
            </div>
        );
    }

    // Determine matches to show: first 5 or all
    const visibleMatches = showAll ? matches : matches.slice(0, 5);
    const hasMore = matches.length > 5;

    return (
        <div className="mb-2 w-full animate-in fade-in duration-500">
            {/* 🏆 Title + Team Logo centered */}
            <div className="flex flex-col items-start mb-2 border-b border-white/10 pb-1">
                <div className="flex items-center justify-start gap-2">
                    {teamLogo && (
                        <img
                            src={teamLogo}
                            alt={`${teamName} Logo`}
                            className="w-6 h-6 object-contain"
                        />
                    )}
                    <h4 className="text-[10px] sm:text-xs font-bold text-emerald-200/70 tracking-wide capitalize">
                        {teamName}
                    </h4>
                </div>
            </div>

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

                    return (
                        <div
                            key={i}
                            className={`grid grid-cols-[auto_1fr_auto_1fr] md:grid-cols-4 items-center p-2 text-sm transition-colors ${bgClass} ${hoverClass}`}
                        >
                            {/* 1️⃣ Date */}
                            <div className="flex flex-col items-center justify-center mr-2 w-10 shrink-0">
                                <span className="text-gray-500 text-[10px] font-medium leading-none mb-0.5">{monthDay}</span>
                                <span className="text-gray-600 text-[9px] leading-none">{year}</span>
                            </div>

                            {/* 2️⃣ Home Team */}
                            <div className="flex items-center justify-end gap-2 pr-3 min-w-0">
                                <span className="font-medium text-gray-300 text-xs md:text-sm whitespace-normal break-words leading-tight text-right">{m.homeTeam.name}</span>
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
                            <div className="flex items-center justify-start gap-2 pl-3 min-w-0">
                                {m.awayTeam.logo && (
                                    <img src={m.awayTeam.logo} alt={m.awayTeam.name} className="w-5 h-5 object-contain flex-shrink-0" />
                                )}
                                <span className="font-medium text-gray-300 text-xs md:text-sm whitespace-normal break-words leading-tight text-left">{m.awayTeam.name}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Show More Button */}
            {hasMore && (
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="w-full mt-3 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded-lg flex items-center justify-center gap-1 transition-all"
                >
                    {showAll ? (
                        <>
                            Show Less <ChevronUp size={14} />
                        </>
                    ) : (
                        <>
                            Show More <ChevronDown size={14} />
                        </>
                    )}
                </button>
            )}
        </div>
    );
};

export default LastFiveMatches;
