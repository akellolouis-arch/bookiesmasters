
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

    const visibleMatches = h2h.slice(0, 5);

    // Calculate Stats
    const teamA = h2h[0].teams.home.name;
    const teamB = h2h[0].teams.away.name;

    let teamAWins = 0;
    let teamBWins = 0;
    let draws = 0;

    visibleMatches.forEach(match => {
        if (match.goals.home !== null && match.goals.away !== null) {
            if (match.goals.home === match.goals.away) {
                draws++;
            } else if (match.goals.home > match.goals.away) {
                if (match.teams.home.name === teamA) teamAWins++;
                else teamBWins++;
            } else if (match.goals.away > match.goals.home) {
                if (match.teams.away.name === teamA) teamAWins++;
                else teamBWins++;
            }
        }
    });

    const totalMatches = visibleMatches.length;
    const teamAPct = totalMatches ? Math.round((teamAWins / totalMatches) * 100) : 0;
    const drawPct = totalMatches ? Math.round((draws / totalMatches) * 100) : 0;
    const teamBPct = totalMatches ? Math.round((teamBWins / totalMatches) * 100) : 0;

    const generateH2HStory = () => {
        if (totalMatches === 0) return null;

        if (teamAPct >= 60) {
            return `Head-to-head dominance: ${teamA} has historically controlled this matchup, winning ${teamAPct}% of the last ${totalMatches} encounters.`;
        } else if (teamBPct >= 60) {
            return `Head-to-head dominance: ${teamB} has historically controlled this matchup, winning ${teamBPct}% of the last ${totalMatches} encounters.`;
        } else if (drawPct >= 60) {
            return `Fierce rivalry: These two teams frequently neutralize each other, with ${drawPct}% of their last ${totalMatches} meetings ending in a draw.`;
        } else {
            return `Evenly matched: Recent head-to-head history is highly competitive, with ${teamA} securing ${teamAWins} win${teamAWins !== 1 ? 's' : ''}, ${teamB} taking ${teamBWins} win${teamBWins !== 1 ? 's' : ''}, and ${draws} draw${draws !== 1 ? 's' : ''}.`;
        }
    };

    const storyText = generateH2HStory();

    return (
        <div className="mb-2 w-full animate-in fade-in duration-500">
            <h3 className="text-xs font-bold tracking-wide capitalize text-left text-emerald-200/70 mb-2 border-b border-white/10 pb-1">Head to Head</h3>
            <div className="flex flex-col">
                {visibleMatches.map((match, i) => {
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
                            <div className={`font-medium text-[9px] sm:text-[10px] truncate text-right px-1 pr-3 flex-1 min-w-0 ${match.teams.home.winner ? 'text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]' : 'text-gray-200'}`}>
                                {match.teams.home.name}
                            </div>

                            {/* 3️⃣ Score */}
                            <div className="flex flex-col items-center justify-center shrink-0 w-14">
                                <div className="flex justify-center w-full font-bold text-white bg-black/40 px-2 py-0.5 rounded text-[9px] sm:text-[10px]">
                                    {match.goals.home} - {match.goals.away}
                                </div>
                                {match.score?.halftime && match.score.halftime.home !== null && match.score.halftime.away !== null && (
                                    <span className="text-[10px] text-gray-500 mt-0.5 font-medium tracking-wide">
                                        {match.score.halftime.home}-{match.score.halftime.away}
                                    </span>
                                )}
                            </div>

                            {/* 4️⃣ Away Team */}
                            <div className={`font-medium text-[9px] sm:text-[10px] truncate text-left px-1 pl-3 flex-1 min-w-0 ${match.teams.away.winner ? 'text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]' : 'text-gray-200'}`}>
                                {match.teams.away.name}
                            </div>
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
                        <div className="flex-1 bg-blue-500 h-full" />
                    </div>
                    
                    {/* Stats Columns */}
                    <div className="flex justify-between text-center px-1 md:px-4">
                        {/* Team A */}
                        <div className="flex flex-col items-center">
                            <span className="text-gray-200 text-[10px] sm:text-xs font-bold mb-1 max-w-[80px] sm:max-w-[100px] truncate">{teamA} {teamAWins}</span>
                            <span className="text-gray-400 text-xs mb-1">{teamAPct}%</span>
                            <div className="w-8 h-1 bg-green-500 rounded-full" />
                        </div>
                        {/* Draw */}
                        <div className="flex flex-col items-center">
                            <span className="text-gray-200 text-[10px] sm:text-xs font-bold mb-1">Draw {draws}</span>
                            <span className="text-gray-400 text-xs mb-1">{drawPct}%</span>
                            <div className="w-8 h-1 bg-yellow-500 rounded-full" />
                        </div>
                        {/* Team B */}
                        <div className="flex flex-col items-center">
                            <span className="text-gray-200 text-[10px] sm:text-xs font-bold mb-1 max-w-[80px] sm:max-w-[100px] truncate">{teamB} {teamBWins}</span>
                            <span className="text-gray-400 text-xs mb-1">{teamBPct}%</span>
                            <div className="w-8 h-1 bg-blue-500 rounded-full" />
                        </div>
                    </div>
                </div>
            )}

            {/* Expert Insight Story */}
            {storyText && (
                <div className="mt-4 bg-white/5 rounded-xl p-3 shadow-sm flex items-start gap-3">
                    <p className="text-[11px] sm:text-xs font-medium italic text-gray-300 leading-relaxed">
                        {storyText}
                    </p>
                </div>
            )}

        </div>
    );
};

export default H2HSection;
