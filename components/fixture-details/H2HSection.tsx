
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
        <div className="mb-6 w-full animate-in fade-in duration-500">
            <h3 className="text-sm font-bold text-left text-gray-200 mb-4 border-b border-white/10 pb-2">Head to Head</h3>
            <div className="flex flex-col gap-2">
                {h2h.slice(0, 5).map((match) => {
                    const matchDate = new Date(match.fixture.date).toLocaleDateString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "2-digit",
                    });

                    return (
                        <div
                            key={match.fixture.id}
                            className="grid grid-cols-[auto_1fr_auto_1fr] md:grid-cols-4 items-center bg-white/5 hover:bg-white/10 p-2 rounded text-sm transition-colors border border-transparent hover:border-white/5"
                        >
                            {/* 1️⃣ Date */}
                            <div className="truncate text-gray-500 text-xs md:text-xs mr-2">{matchDate}</div>

                            {/* 2️⃣ Home Team */}
                            <div className={`truncate font-medium text-right pr-3 text-xs md:text-sm ${match.teams.home.winner ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
                                {match.teams.home.name}
                            </div>

                            {/* 3️⃣ Score */}
                            <div className="flex justify-center font-bold text-white bg-black/40 px-2 py-0.5 rounded min-w-[3rem] text-xs">
                                {match.goals.home} - {match.goals.away}
                            </div>

                            {/* 4️⃣ Away Team */}
                            <div className={`truncate font-medium text-left pl-3 text-xs md:text-sm ${match.teams.away.winner ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
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
