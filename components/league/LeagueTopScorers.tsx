import React from "react";
import Image from "next/image";
import { Award } from "lucide-react";

export interface ScorerItem {
    rank: number;
    player: {
        id: number;
        name: string;
        firstname?: string;
        lastname?: string;
        photo?: string;
        nationality?: string;
    };
    team: {
        id: number;
        name: string;
        logo?: string;
    };
    goals: number;
    assists?: number;
    appearances?: number;
    minutes?: number;
    penalties?: number;
    rating?: string | null;
}

interface LeagueTopScorersProps {
    scorers: ScorerItem[];
}

const LeagueTopScorers: React.FC<LeagueTopScorersProps> = ({ scorers }) => {
    if (!scorers || scorers.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center shadow-xs">
                <div className="w-12 h-12 mx-auto rounded-full bg-teal-50 flex items-center justify-center mb-3">
                    <Award className="w-6 h-6 text-teal-600" />
                </div>
                <h4 className="text-sm font-bold text-gray-800 mb-1">
                    Top Scorers Unavailable
                </h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Player scoring statistics are not currently available for this league or tournament.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2 w-full animate-in fade-in duration-300">
            <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                <table className="w-full text-[11px] sm:text-[12px] text-left min-w-[500px]">
                    <thead>
                        <tr className="text-gray-500 border-b border-gray-200 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">
                            <th className="py-2 px-2 text-center w-8">#</th>
                            <th className="py-2 px-2 text-left">Player</th>
                            <th className="py-2 px-2 text-left">Team</th>
                            <th className="py-2 px-2 text-center">MP</th>
                            <th className="py-2 px-2 text-center">Assists</th>
                            <th className="py-2 px-2 text-center">Pen</th>
                            <th className="sticky right-0 z-10 bg-white py-2 px-3 text-right font-bold text-teal-700 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)]">
                                Goals
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {scorers.map((item, idx) => {
                            const isTop3 = idx < 3;
                            const badgeColor =
                                idx === 0
                                    ? "bg-amber-100 text-amber-800 font-bold border border-amber-300"
                                    : idx === 1
                                    ? "bg-slate-200 text-slate-800 font-bold"
                                    : idx === 2
                                    ? "bg-orange-100 text-orange-800 font-bold"
                                    : "text-gray-500";

                            return (
                                <tr
                                    key={item.player.id || idx}
                                    className="hover:bg-gray-50 transition-colors group"
                                >
                                    {/* Rank */}
                                    <td className="py-2 px-2 text-center">
                                        <span
                                            className={`inline-flex items-center justify-center w-5 h-5 text-[10px] rounded-full ${badgeColor}`}
                                        >
                                            {item.rank || idx + 1}
                                        </span>
                                    </td>

                                    {/* Player Info */}
                                    <td className="py-2 px-2">
                                        <div className="flex items-center gap-2">
                                            {item.player.photo ? (
                                                <img
                                                    src={item.player.photo}
                                                    alt={item.player.name}
                                                    className="w-7 h-7 rounded-full object-cover border border-gray-200 flex-shrink-0"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                                                    {item.player.name?.substring(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-semibold text-gray-900 truncate leading-tight group-hover:text-teal-700 transition-colors">
                                                    {item.player.name}
                                                </span>
                                                {item.player.nationality && (
                                                    <span className="text-[9px] text-gray-400 truncate">
                                                        {item.player.nationality}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Team Info */}
                                    <td className="py-2 px-2">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            {item.team.logo && (
                                                <img
                                                    src={item.team.logo}
                                                    alt={item.team.name}
                                                    className="w-4 h-4 object-contain flex-shrink-0"
                                                    loading="lazy"
                                                />
                                            )}
                                            <span className="text-gray-700 truncate max-w-[120px] sm:max-w-[160px]">
                                                {item.team.name}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Matches Played (Appearances) */}
                                    <td className="py-2 px-2 text-center text-gray-600 font-medium">
                                        {item.appearances ?? "-"}
                                    </td>

                                    {/* Assists */}
                                    <td className="py-2 px-2 text-center text-gray-600">
                                        {item.assists ?? 0}
                                    </td>

                                    {/* Penalties */}
                                    <td className="py-2 px-2 text-center text-gray-500">
                                        {item.penalties ?? 0}
                                    </td>

                                    {/* Total Goals */}
                                    <td className="sticky right-0 z-10 bg-white group-hover:bg-gray-50 transition-colors py-2 px-3 text-right font-black text-teal-700 text-sm shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)]">
                                        {item.goals}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeagueTopScorers;

