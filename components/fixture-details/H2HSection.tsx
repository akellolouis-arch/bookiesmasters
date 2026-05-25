
import React from "react";

interface MatchTeam {
    id: number;
    name: string;
    logo: string;
    winner: boolean | null;
}

interface MatchGoals {
    home: number | null;
    away: number | null;
}

interface H2HMatch {
    fixture: {
        id: number;
        date: string;
        status: { short: string; long: string };
    };
    teams: {
        home: MatchTeam;
        away: MatchTeam;
    };
    goals: MatchGoals;
    score: {
        halftime: MatchGoals;
        fulltime: MatchGoals;
    };
}

interface H2HSectionProps {
    h2h: H2HMatch[];
}

const H2HSection: React.FC<H2HSectionProps> = ({ h2h }) => {
    if (!h2h || h2h.length === 0)
        return <p className="text-center text-gray-400 mb-6">No H2H data available</p>;

    return (
        <div className="mb-2 w-full animate-in fade-in duration-500">
            <h3 className="text-xs font-bold tracking-wide capitalize text-left text-emerald-200/70 mb-2 border-b border-white/10 pb-1">Head to Head</h3>
            <div className="flex flex-col">
                {h2h.slice(0, 5).map((match, i) => {
                    const matchDateObj = new Date(match.fixture.date);
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
                            key={match.fixture.id}
                            className={`grid grid-cols-[auto_1fr_auto_1fr] md:grid-cols-4 items-center p-2 text-sm transition-colors ${bgClass} ${hoverClass}`}
                        >
                            {/* 1️⃣ Date */}
                            <div className="flex flex-col items-center justify-center mr-2 w-10 shrink-0">
                                <span className="text-gray-500 text-[10px] font-medium leading-none mb-0.5">{monthDay}</span>
                                <span className="text-gray-600 text-[9px] leading-none">{year}</span>
                            </div>

                            {/* 2️⃣ Home Team */}
                            <div className={`font-medium text-right pr-3 text-xs md:text-sm whitespace-normal break-words leading-tight ${match.teams.home.winner ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
                                {match.teams.home.name}
                            </div>

                            {/* 3️⃣ Score */}
                            <div className="flex flex-col items-center justify-center shrink-0 w-14">
                                <div className="flex justify-center w-full font-bold text-white bg-black/40 px-2 py-0.5 rounded text-xs">
                                    {match.goals.home} - {match.goals.away}
                                </div>
                                {match.score?.halftime && match.score.halftime.home !== null && match.score.halftime.away !== null && (
                                    <span className="text-[10px] text-gray-500 mt-0.5 font-medium tracking-wide">
                                        {match.score.halftime.home}-{match.score.halftime.away}
                                    </span>
                                )}
                            </div>

                            {/* 4️⃣ Away Team */}
                            <div className={`font-medium text-left pl-3 text-xs md:text-sm whitespace-normal break-words leading-tight ${match.teams.away.winner ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
                                {match.teams.away.name}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default H2HSection;
