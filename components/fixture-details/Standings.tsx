import React, { useState } from 'react';

interface StandingTeam {
    rank: number;
    team: {
        id: number;
        name: string;
        logo: string;
    };
    points: number;
    goalsDiff: number;
    group: string;
    form: string;
    all: {
        played: number;
        win: number;
        draw: number;
        lose: number;
        goals: {
            for: number;
            against: number;
        };
    };
}

interface StandingsProps {
    standings: StandingTeam[][];
    homeTeamId?: number;
    awayTeamId?: number;
}

const Standings: React.FC<StandingsProps> = ({ standings, homeTeamId, awayTeamId }) => {
    const [showAll, setShowAll] = useState(false);
    if (!standings || standings.length === 0) {
        return (
            <div className="text-center p-4 text-gray-600 bg-white rounded-lg">
                No standings available
            </div>
        );
    }

    const relevantGroups = standings.filter(group => {
        if (!homeTeamId && !awayTeamId) return true;
        return group.some(t => t.team.id === homeTeamId || t.team.id === awayTeamId);
    });
    const displayGroups = relevantGroups.length > 0 ? relevantGroups : standings;

    return (
        <div className="space-y-2 w-full animate-in fade-in duration-500">
            {displayGroups.map((group, groupIndex) => {
                const getVisibleTeams = () => {
                    if (showAll || !homeTeamId || !awayTeamId) return { teams: group, gaps: [] };

                    const hIdx = group.findIndex(t => t.team.id === homeTeamId);
                    const aIdx = group.findIndex(t => t.team.id === awayTeamId);

                    const indices = new Set<number>();
                    if (hIdx !== -1) {
                        indices.add(hIdx - 1);
                        indices.add(hIdx);
                        indices.add(hIdx + 1);
                    }
                    if (aIdx !== -1) {
                        indices.add(aIdx - 1);
                        indices.add(aIdx);
                        indices.add(aIdx + 1);
                    }

                    const validIndices = Array.from(indices).filter(i => i >= 0 && i < group.length).sort((a, b) => a - b);
                    if (validIndices.length === 0) return { teams: group, gaps: [] };

                    const teams = validIndices.map(i => group[i]);
                    const gaps: number[] = [];
                    for (let i = 1; i < validIndices.length; i++) {
                        if (validIndices[i] > validIndices[i - 1] + 1) {
                            gaps.push(i);
                        }
                    }

                    return { teams, gaps };
                };

                const { teams: visibleGroup, gaps } = getVisibleTeams();
                const hasMore = visibleGroup.length < group.length;

                return (
                <div key={groupIndex} className="w-full">
                    {/* Only show group name if there are multiple groups (e.g. AFCON) */}
                    {standings.length > 1 && (
                        <h3 className="text-[11px] sm:text-[12px] font-bold tracking-wide capitalize text-blue-800 mb-2 px-1">
                            {group[0].group}
                        </h3>
                    )}

                    <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        <table className="w-full text-[11px] sm:text-[12px] text-left min-w-[500px]">
                            <thead>
                                <tr className="text-gray-600 border-b border-gray-200">
                                    <th className="sticky left-0 z-20 bg-[#0a0a0a] py-1 px-1 w-8 text-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">#</th>
                                    <th className="sticky left-8 z-20 bg-[#0a0a0a] py-1 px-1 text-left shadow-[4px_0_8px_-2px_rgba(0,0,0,0.8)]">Team</th>
                                    <th className="py-1 px-0.5 text-center whitespace-nowrap">MP</th>
                                    <th className="py-1 px-0.5 text-center whitespace-nowrap">W</th>
                                    <th className="py-1 px-0.5 text-center whitespace-nowrap">D</th>
                                    <th className="py-1 px-0.5 text-center whitespace-nowrap">L</th>
                                    <th className="py-1 px-0.5 text-center whitespace-nowrap">GF</th>
                                    <th className="py-1 px-0.5 text-center whitespace-nowrap">GA</th>
                                    <th className="py-1 px-0.5 text-center whitespace-nowrap">GD</th>
                                    <th className="py-1 px-0.5 text-center whitespace-nowrap">Form</th>
                                    <th className="sticky right-0 z-20 bg-[#0a0a0a] py-1 px-1 md:px-2 text-center font-bold shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.8)]">Pts</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleGroup.map((team, idx) => {
                                    const isTarget = team.team.id === homeTeamId || team.team.id === awayTeamId;
                                    const bgColor = "bg-[#0a0a0a] group-hover:bg-white";
                                    const textColorPrimary = isTarget ? "text-gray-900 font-bold" : "text-gray-600";
                                    const textColorSecondary = isTarget ? "text-gray-900/70" : "text-gray-600";
                                    const textColorTertiary = isTarget ? "text-gray-900/90" : "text-gray-700";

                                    return (
                                        <React.Fragment key={team.team.id}>
                                            {gaps.includes(idx) && (
                                                <tr className="border-b border-gray-200 bg-[#0a0a0a]/50">
                                                    <td colSpan={11} className="py-1 text-center text-gray-500 text-xs tracking-widest sticky left-0 z-10 w-full shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">···</td>
                                                </tr>
                                            )}
                                            <tr className="group transition-colors border-b border-gray-200 last:border-0 hover:bg-gray-100">
                                                <td className={`sticky left-0 z-10 py-1.5 px-1 w-8 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] transition-colors ${bgColor}`}>
                                                    <span
                                                        className={`flex items-center justify-center w-5 h-5 text-[10px] rounded-full font-medium mx-auto ${isTarget ? 'bg-gray-300 text-gray-900' : (team.rank <= 4 ? 'bg-blue-600/20 text-blue-400' :
                                                            team.rank >= group.length - 2 ? 'bg-red-600/20 text-red-400' :
                                                                'text-gray-600')
                                                            }`}
                                                    >
                                                        {team.rank}
                                                    </span>
                                                </td>
                                                <td className={`sticky left-8 z-10 py-1.5 px-1 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.8)] transition-colors ${bgColor}`}>
                                                    <div className="flex items-center space-x-2">
                                                        <img
                                                            src={team.team.logo}
                                                            alt={team.team.name + ""}
                                                            className="w-5 h-5 object-contain"
                                                        />
                                                        <span className={`font-medium truncate max-w-[100px] sm:max-w-[140px] text-[11px] sm:text-[12px] leading-tight ${textColorPrimary}`}>
                                                            {team.team.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className={`py-1.5 px-0.5 text-center ${textColorTertiary}`}>{team.all.played}</td>
                                                <td className={`py-1.5 px-0.5 text-center ${textColorSecondary}`}>{team.all.win}</td>
                                                <td className={`py-1.5 px-0.5 text-center ${textColorSecondary}`}>{team.all.draw}</td>
                                                <td className={`py-1.5 px-0.5 text-center ${textColorSecondary}`}>{team.all.lose}</td>
                                                <td className={`py-1.5 px-0.5 text-center font-bold ${textColorPrimary}`}>{team.all.goals?.for || 0}</td>
                                                <td className={`py-1.5 px-0.5 text-center ${textColorSecondary}`}>{team.all.goals?.against || 0}</td>
                                                <td className={`py-1.5 px-0.5 text-center font-bold ${isTarget ? 'text-emerald-300' : (team.goalsDiff > 0 ? 'text-green-400' : team.goalsDiff < 0 ? 'text-red-400' : 'text-gray-600')}`}>
                                                    {team.goalsDiff > 0 ? `+${team.goalsDiff}` : team.goalsDiff}
                                                </td>
                                                <td className="py-1.5 px-0.5 text-center">
                                                    <div className="flex justify-center space-x-0.5">
                                                        {team.form?.split('').slice(-5).map((result, i) => (
                                                            <span
                                                                key={i}
                                                                className={`w-1.5 h-1.5 rounded-full ${result === 'W' ? 'bg-green-500' :
                                                                    result === 'D' ? 'bg-yellow-500' :
                                                                        'bg-red-500'
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className={`sticky right-0 z-10 py-1.5 px-1 md:px-2 text-center font-bold shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.8)] transition-colors ${bgColor} ${textColorPrimary}`}>
                                                    {team.points}
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {(hasMore || showAll) && (
                        <div className="flex justify-center mt-3 mb-1">
                            <button
                                onClick={() => setShowAll(!showAll)}
                                className="px-4 py-1.5 text-[10px] sm:text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 rounded-full transition-all"
                            >
                                {showAll ? "View less" : "View all"}
                            </button>
                        </div>
                    )}
                </div>
                );
            })}
        </div >
    );
};

export default Standings;
