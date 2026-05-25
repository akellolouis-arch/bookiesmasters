import React from 'react';

interface StandingTeam {
    rank: number;
    team: {
        id: number;
        name: number;
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
    };
}

interface StandingsProps {
    standings: StandingTeam[][];
}

const Standings: React.FC<StandingsProps> = ({ standings }) => {
    if (!standings || standings.length === 0) {
        return (
            <div className="text-center p-4 text-gray-400 bg-[#1F1F1F] rounded-lg">
                No standings available
            </div>
        );
    }

    return (
        <div className="space-y-2 w-full animate-in fade-in duration-500">
            {standings.map((group, groupIndex) => (
                <div key={groupIndex} className="w-full">
                    {/* Only show group name if there are multiple groups (e.g. AFCON) */}
                    {standings.length > 1 && (
                        <h3 className="text-[10px] sm:text-xs font-bold tracking-wide capitalize text-emerald-200/70 mb-2 px-1">
                            {group[0].group}
                        </h3>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead>
                                <tr className="text-gray-400 border-b border-white/5">
                                    <th className="py-1 px-1 w-6 text-center">#</th>
                                    <th className="py-1 px-1 text-left">Team</th>
                                    <th className="py-1 px-1 text-center">MP</th>
                                    <th className="py-1 px-1 text-center">W</th>
                                    <th className="py-1 px-1 text-center">D</th>
                                    <th className="py-1 px-1 text-center">L</th>
                                    <th className="py-1 px-1 text-center">GD</th>
                                    <th className="py-1 px-1 text-center font-bold">Pts</th>
                                    <th className="py-1 px-1 text-center hidden sm:table-cell">Form</th>
                                </tr>
                            </thead>
                            <tbody>
                                {group.map((team) => (
                                    <tr key={team.team.id} className="hover:bg-white/5 transition-colors">
                                        <td className="py-1 px-1">
                                            <span
                                                className={`flex items-center justify-center w-5 h-5 text-[10px] rounded-full font-medium mx-auto ${team.rank <= 4 ? 'bg-blue-600/20 text-blue-400' :
                                                    team.rank >= group.length - 2 ? 'bg-red-600/20 text-red-400' :
                                                        'text-gray-400'
                                                    }`}
                                            >
                                                {team.rank}
                                            </span>
                                        </td>
                                        <td className="py-1 px-1">
                                            <div className="flex items-center space-x-2">
                                                <img
                                                    src={team.team.logo}
                                                    alt={team.team.name + ""}
                                                    className="w-5 h-5 object-contain"
                                                />
                                                <span className="font-medium text-gray-200 truncate max-w-[100px] sm:max-w-[120px] text-xs leading-tight">
                                                    {team.team.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-1 px-1 text-center text-gray-300">{team.all.played}</td>
                                        <td className="py-1 px-1 text-center text-gray-400">{team.all.win}</td>
                                        <td className="py-1 px-1 text-center text-gray-400">{team.all.draw}</td>
                                        <td className="py-1 px-1 text-center text-gray-400">{team.all.lose}</td>
                                        <td className={`py-1 px-1 text-center font-medium ${team.goalsDiff > 0 ? 'text-green-400' :
                                            team.goalsDiff < 0 ? 'text-red-400' : 'text-gray-400'
                                            }`}>
                                            {team.goalsDiff > 0 ? `+${team.goalsDiff}` : team.goalsDiff}
                                        </td>
                                        <td className="py-1 px-1 text-center font-bold text-gray-200">{team.points}</td>
                                        <td className="py-1 px-1 text-center hidden sm:table-cell">
                                            <div className="flex justify-center space-x-0.5">
                                                {team.form?.split('').slice(-5).map((result, i) => (
                                                    <span
                                                        key={i}
                                                        className={`w-1 h-1 rounded-full ${result === 'W' ? 'bg-green-500' :
                                                            result === 'D' ? 'bg-orange-500' :
                                                                'bg-red-500'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div >
    );
};

export default Standings;
