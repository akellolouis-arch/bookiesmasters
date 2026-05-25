import React from 'react';

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
                        <h3 className="text-xs font-bold tracking-wide capitalize text-amber-100 mb-2 px-1">
                            {group[0].group}
                        </h3>
                    )}

                    <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        <table className="w-full text-xs text-left min-w-[500px]">
                            <thead>
                                <tr className="text-gray-400 border-b border-white/5">
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
                                {group.map((team) => (
                                    <tr key={team.team.id} className="group hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                                        <td className="sticky left-0 z-10 bg-[#0a0a0a] group-hover:bg-[#121212] py-1.5 px-1 w-8 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] transition-colors">
                                            <span
                                                className={`flex items-center justify-center w-5 h-5 text-[10px] rounded-full font-medium mx-auto ${team.rank <= 4 ? 'bg-blue-600/20 text-blue-400' :
                                                    team.rank >= group.length - 2 ? 'bg-red-600/20 text-red-400' :
                                                        'text-gray-400'
                                                    }`}
                                            >
                                                {team.rank}
                                            </span>
                                        </td>
                                        <td className="sticky left-8 z-10 bg-[#0a0a0a] group-hover:bg-[#121212] py-1.5 px-1 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.8)] transition-colors">
                                            <div className="flex items-center space-x-2">
                                                <img
                                                    src={team.team.logo}
                                                    alt={team.team.name + ""}
                                                    className="w-5 h-5 object-contain"
                                                />
                                                <span className="font-medium text-gray-200 truncate max-w-[100px] sm:max-w-[140px] text-xs leading-tight">
                                                    {team.team.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-1.5 px-0.5 text-center text-gray-300">{team.all.played}</td>
                                        <td className="py-1.5 px-0.5 text-center text-gray-400">{team.all.win}</td>
                                        <td className="py-1.5 px-0.5 text-center text-gray-400">{team.all.draw}</td>
                                        <td className="py-1.5 px-0.5 text-center text-gray-400">{team.all.lose}</td>
                                        <td className="py-1.5 px-0.5 text-center text-gray-300 font-medium">{team.all.goals?.for || 0}</td>
                                        <td className="py-1.5 px-0.5 text-center text-gray-400">{team.all.goals?.against || 0}</td>
                                        <td className={`py-1.5 px-0.5 text-center font-medium ${team.goalsDiff > 0 ? 'text-green-400' :
                                            team.goalsDiff < 0 ? 'text-red-400' : 'text-gray-400'
                                            }`}>
                                            {team.goalsDiff > 0 ? `+${team.goalsDiff}` : team.goalsDiff}
                                        </td>
                                        <td className="py-1.5 px-0.5 text-center">
                                            <div className="flex justify-center space-x-0.5">
                                                {team.form?.split('').slice(-5).map((result, i) => (
                                                    <span
                                                        key={i}
                                                        className={`w-1.5 h-1.5 rounded-full ${result === 'W' ? 'bg-green-500' :
                                                            result === 'D' ? 'bg-orange-500' :
                                                                'bg-red-500'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </td>
                                        <td className="sticky right-0 z-10 bg-[#0a0a0a] group-hover:bg-[#121212] py-1.5 px-1 md:px-2 text-center font-bold text-gray-200 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.8)] transition-colors">
                                            {team.points}
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
