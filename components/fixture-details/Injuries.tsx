import React from "react";

interface Injury {
    player: {
        id: number;
        name: string;
        photo: string;
        type: string; // "Missing Fixture", "Questionable"
        reason: string; // "Groin Injury", "Suspended"
    };
    team: {
        id: number;
        name: string;
        logo: string;
    };
    fixture: {
        id: number;
        timezone: string;
        date: string;
        timestamp: number;
    };
    league: {
        id: number;
        season: number;
        name: string;
        country: string;
        logo: string;
        flag: string;
    };
}

interface InjuriesProps {
    injuries: Injury[];
}

export default function Injuries({ injuries }: InjuriesProps) {
    if (!injuries || injuries.length === 0) {
        return (
            <div className="p-6 text-center text-gray-500">
                <p>No reported injuries or suspensions.</p>
            </div>
        );
    }

    // Deduplicate injuries (API sometimes returns same player multiple times)
    const uniqueInjuries = Array.from(new Map(injuries.map(i => [i.player?.id || i.player?.name || "unknown", i])).values());

    // Get unique teams from deduplicated list
    const teams = Array.from(new Set(uniqueInjuries.map(i => i.team.name)));

    return (
        <div className="w-full flex flex-col gap-1 sm:gap-2 animate-in fade-in duration-500">
            {teams.map(teamName => {
                const teamInjuries = uniqueInjuries.filter(i => i.team.name === teamName);
                const teamLogo = teamInjuries[0].team.logo;

                return (
                    <div key={teamName} className="w-full">
                        <div className="flex items-center gap-1.5 sm:gap-3 mb-1 sm:mb-2 pb-1 sm:pb-2 border-b border-white/5">
                            <img src={teamLogo} alt={teamName} className="w-4 h-4 sm:w-6 sm:h-6 object-contain shrink-0" />
                            <h3 className="text-sm font-bold text-gray-200 capitalize tracking-widest truncate">{teamName}</h3>
                        </div>

                        <div className="space-y-1 sm:space-y-1.5">
                            {teamInjuries.map((injury, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 sm:gap-3">
                                    <img
                                        src={injury.player.photo}
                                        alt={injury.player.name}
                                        className="w-5 h-5 sm:w-8 sm:h-8 rounded-full bg-gray-800 object-cover border border-white/10 shrink-0"
                                    />
                                    <div className="flex flex-col min-w-0">
                                        <p className="text-[9px] sm:text-xs font-bold text-white truncate">{injury.player.name}</p>
                                        <p className="text-[8px] sm:text-[10px] text-red-400 font-medium capitalize mt-0.5 truncate">{injury.player.reason}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
