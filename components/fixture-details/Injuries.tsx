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

const getInjuryIcon = (reason: string) => {
    const lower = reason.toLowerCase();
    if (lower.includes('suspend') || lower.includes('red') || lower.includes('card')) {
        return <div className="w-2.5 h-3.5 bg-red-500 rounded-sm shrink-0 border border-red-700 shadow-[0_0_4px_rgba(239,68,68,0.5)]" />;
    }
    if (lower.includes('yellow')) {
        return <div className="w-2.5 h-3.5 bg-yellow-400 rounded-sm shrink-0 border border-yellow-600 shadow-[0_0_4px_rgba(250,204,21,0.5)]" />;
    }
    if (lower.includes('question') || lower.includes('doubt')) {
        return <span className="text-[12px] text-amber-500 font-bold shrink-0 leading-none drop-shadow-sm">?</span>;
    }
    return <span className="text-[12px] text-rose-500 leading-none shrink-0 font-bold drop-shadow-sm">✚</span>;
};

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
        <div className="w-full flex flex-col gap-4 sm:gap-6 animate-in fade-in duration-500">
            {teams.map(teamName => {
                const teamInjuries = uniqueInjuries.filter(i => i.team.name === teamName);
                const teamLogo = teamInjuries[0].team.logo;

                return (
                    <div key={teamName} className="w-full">
                        <div className="flex flex-col items-start mb-2 border-b border-white/10 pb-1">
                            <div className="flex items-center justify-start gap-2">
                                <img src={teamLogo} alt={teamName} className="w-6 h-6 object-contain shrink-0" />
                                <h4 className="text-[10px] sm:text-[11px] font-bold text-emerald-200/70 tracking-wide capitalize truncate">{teamName}</h4>
                            </div>
                        </div>

                        <div className="space-y-2 sm:space-y-3 mt-2">
                            {teamInjuries.map((injury, idx) => (
                                <div key={idx} className="flex items-center gap-2 sm:gap-3">
                                    <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold w-3 sm:w-4 text-right shrink-0">{idx + 1}.</span>
                                    <img
                                        src={injury.player.photo}
                                        alt={injury.player.name}
                                        className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gray-800 object-cover border border-white/10 shrink-0"
                                    />
                                    <div className="flex items-center justify-between min-w-0 w-full">
                                        <p className="text-[10px] sm:text-[11px] font-medium text-gray-200 leading-tight truncate">{injury.player.name}</p>
                                        <div className="flex items-center gap-1.5 w-28 sm:w-36 shrink-0 ml-2 justify-start">
                                            {getInjuryIcon(injury.player.reason)}
                                            <p className="text-[9px] sm:text-[10px] text-gray-500 capitalize text-left truncate">{injury.player.reason}</p>
                                        </div>
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
