"use client";

import React from "react";
import FootballPitch from "./FootballPitch";

interface Player {
    id: number;
    name: string;
    number: number;
    pos: string; // "G", "D", "M", "F"
    grid: string | null;
}

interface Lineup {
    team: {
        id: number;
        name: string;
        logo: string;
        colors: any;
    };
    formation: string;
    startXI: { player: Player }[];
    substitutes: { player: Player }[];
    coach?: {
        id?: number;
        name?: string;
        photo?: string;
    };
}

export interface InjuryItem {
    player: {
        id?: number;
        name: string;
        photo?: string;
        type?: string;
        reason?: string;
    };
    team: {
        id?: number;
        name: string;
        logo?: string;
    };
}

interface LineupsProps {
    lineups: Lineup[];
    injuries?: InjuryItem[];
}

const getInjuryIcon = (reason?: string) => {
    const lower = (reason || "").toLowerCase();
    if (lower.includes("suspend") || lower.includes("red") || lower.includes("card")) {
        return (
            <span
                className="w-2.5 h-3.5 bg-rose-600 rounded-xs shrink-0 border border-rose-700/50 shadow-xs inline-block"
                title="Suspended"
            />
        );
    }
    if (lower.includes("yellow")) {
        return (
            <span
                className="w-2.5 h-3.5 bg-amber-400 rounded-xs shrink-0 border border-amber-500/50 shadow-xs inline-block"
                title="Card accumulation"
            />
        );
    }
    if (lower.includes("question") || lower.includes("doubt")) {
        return (
            <span className="text-[12px] text-amber-500 font-bold shrink-0 leading-none">
                ?
            </span>
        );
    }
    return (
        <span className="text-[11px] text-rose-500 leading-none shrink-0 font-bold">
            ✚
        </span>
    );
};

export default function Lineups({ lineups, injuries = [] }: LineupsProps) {
    // Deduplicate injuries
    const uniqueInjuries = Array.from(
        new Map(
            (injuries || []).map((i) => [
                i.player?.id || i.player?.name || Math.random(),
                i,
            ])
        ).values()
    );

    // If lineups are not yet released
    if (!lineups || lineups.length === 0) {
        return (
            <div className="p-4 space-y-6">
                <div className="p-6 text-center text-gray-500 bg-gray-50/60 rounded-xl border border-gray-200">
                    <p className="text-xs font-semibold text-gray-700">Lineups not available yet</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                        Starting lineups and substitutes are officially announced 45–60 minutes before kickoff.
                    </p>
                </div>

                {/* Show injuries & suspensions even before confirmed lineups */}
                {uniqueInjuries.length > 0 && (
                    <div className="pt-2">
                        <div className="flex items-center justify-center mb-3">
                            <span className="text-[10px] uppercase tracking-wider text-rose-700 font-bold px-3 py-1 rounded-full bg-rose-50 border border-rose-200 shadow-xs">
                                Confirmed Injuries & Suspensions
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Array.from(new Set(uniqueInjuries.map((i) => i.team?.name))).map((teamName) => {
                                const teamInjuries = uniqueInjuries.filter((i) => i.team?.name === teamName);
                                return (
                                    <div key={teamName} className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                        <h4 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider mb-2">
                                            {teamName}
                                        </h4>
                                        <ul className="space-y-2">
                                            {teamInjuries.map((injury, idx) => (
                                                <li key={idx} className="flex items-center gap-2 text-xs">
                                                    {getInjuryIcon(injury.player?.reason)}
                                                    <div className="min-w-0">
                                                        <span className="font-medium text-gray-900 truncate block">
                                                            {injury.player?.name}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 capitalize truncate block">
                                                            {injury.player?.reason || injury.player?.type || "Unavailable"}
                                                        </span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const [home, away] = lineups;

    // Check if we have grid data for visualization
    const hasGridData = Boolean(home?.startXI?.[0]?.player?.grid);

    // Filter injuries for Home and Away
    const homeInjuries = uniqueInjuries.filter((i) => {
        if (home.team?.id && i.team?.id === home.team.id) return true;
        if (home.team?.name && i.team?.name) {
            return i.team.name.toLowerCase().includes(home.team.name.toLowerCase()) ||
                   home.team.name.toLowerCase().includes(i.team.name.toLowerCase());
        }
        return false;
    });

    const awayInjuries = uniqueInjuries.filter((i) => {
        if (away.team?.id && i.team?.id === away.team.id) return true;
        if (away.team?.name && i.team?.name) {
            return i.team.name.toLowerCase().includes(away.team.name.toLowerCase()) ||
                   away.team.name.toLowerCase().includes(i.team.name.toLowerCase());
        }
        return false;
    });

    const hasInjuries = homeInjuries.length > 0 || awayInjuries.length > 0;

    return (
        <div className="p-2 sm:p-4 space-y-6">
            {/* Team Headers & Formation */}
            <div className="flex justify-between items-center px-2 sm:px-4 pb-2 border-b border-gray-100">
                <div className="text-left">
                    <p className="text-[12px] font-bold text-teal-700">{home.formation || "4-3-3"}</p>
                    <p className="text-[11px] font-bold text-gray-900 truncate max-w-[130px] sm:max-w-[200px]">
                        {home.team.name}
                    </p>
                </div>
                <div className="text-center">
                    <span className="text-[9px] font-bold text-gray-500 px-2 py-0.5 bg-gray-100 border border-gray-200 rounded-full tracking-wider uppercase">
                        Formation
                    </span>
                </div>
                <div className="text-right">
                    <p className="text-[12px] font-bold text-teal-700">{away.formation || "4-3-3"}</p>
                    <p className="text-[11px] font-bold text-gray-900 truncate max-w-[130px] sm:max-w-[200px]">
                        {away.team.name}
                    </p>
                </div>
            </div>

            {/* 🔥 VISUAL PITCH */}
            {hasGridData && (
                <div className="mb-4">
                    <FootballPitch home={home} away={away} />
                </div>
            )}

            {/* Starting XI Lists Comparison (If NO visual pitch) */}
            {!hasGridData && (
                <div className="grid grid-cols-2 gap-4">
                    {/* Home XI */}
                    <div>
                        <h4 className="text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-3 border-b border-gray-200 pb-1.5">
                            Starting XI
                        </h4>
                        <ul className="space-y-2">
                            {home.startXI.map((item, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-xs">
                                    <span className="w-4 text-gray-400 font-bold text-[10px]">{item.player.number}</span>
                                    <span className="text-gray-900 font-medium truncate">{item.player.name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Away XI */}
                    <div>
                        <h4 className="text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-3 border-b border-gray-200 pb-1.5 text-right">
                            Starting XI
                        </h4>
                        <ul className="space-y-2">
                            {away.startXI.map((item, idx) => (
                                <li key={idx} className="flex items-center justify-end gap-2 text-xs">
                                    <span className="text-gray-900 font-medium truncate text-right">{item.player.name}</span>
                                    <span className="w-4 text-gray-400 font-bold text-[10px] text-right">{item.player.number}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Substitutes Lists Comparison */}
            <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-center mb-3">
                    <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-3 py-0.5 rounded-full uppercase tracking-wider">
                        Substitutes
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Home Subs */}
                    <div>
                        <h4 className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2">
                            {home.team.name}
                        </h4>
                        <ul className="space-y-1.5">
                            {home.substitutes.map((item, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-[11px] text-gray-700">
                                    <span className="w-4 text-gray-400 text-[10px]">{item.player.number}</span>
                                    <span className="truncate">{item.player.name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Away Subs */}
                    <div>
                        <h4 className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2 text-right">
                            {away.team.name}
                        </h4>
                        <ul className="space-y-1.5">
                            {away.substitutes.map((item, idx) => (
                                <li key={idx} className="flex items-center justify-end gap-2 text-[11px] text-gray-700">
                                    <span className="truncate text-right">{item.player.name}</span>
                                    <span className="w-4 text-gray-400 text-[10px] text-right">{item.player.number}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Coaches */}
            {(home.coach?.name || away.coach?.name) && (
                <div className="flex justify-between items-center pt-3 pb-1 border-t border-gray-200 text-xs">
                    <div className="truncate max-w-[48%]">
                        <span className="text-gray-400 text-[10px] uppercase">Coach: </span>
                        <span className="text-gray-900 font-semibold">{home.coach?.name || "TBD"}</span>
                    </div>
                    <div className="truncate max-w-[48%] text-right">
                        <span className="text-gray-400 text-[10px] uppercase">Coach: </span>
                        <span className="text-gray-900 font-semibold">{away.coach?.name || "TBD"}</span>
                    </div>
                </div>
            )}

            {/* 🔥 INJURIES & SUSPENSIONS SECTION (BELOW SUBSTITUTES & COACHES) */}
            {hasInjuries && (
                <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-center mb-3">
                        <span className="text-[10px] uppercase tracking-wider text-rose-700 font-bold px-3 py-0.5 rounded-full bg-rose-50 border border-rose-200 shadow-xs">
                            Injuries & Suspensions
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Home Missing Players */}
                        <div>
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                {home.team.name}
                            </h4>
                            {homeInjuries.length > 0 ? (
                                <ul className="space-y-2">
                                    {homeInjuries.map((injury, idx) => (
                                        <li key={idx} className="flex items-center gap-1.5 text-[11px]">
                                            {getInjuryIcon(injury.player?.reason)}
                                            <div className="min-w-0">
                                                <span className="font-semibold text-gray-900 truncate block">
                                                    {injury.player?.name}
                                                </span>
                                                <span className="text-[10px] text-gray-500 capitalize truncate block">
                                                    {injury.player?.reason || injury.player?.type || "Unavailable"}
                                                </span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-[10px] text-gray-400 italic">No reported injuries</p>
                            )}
                        </div>

                        {/* Away Missing Players */}
                        <div>
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 text-right">
                                {away.team.name}
                            </h4>
                            {awayInjuries.length > 0 ? (
                                <ul className="space-y-2">
                                    {awayInjuries.map((injury, idx) => (
                                        <li key={idx} className="flex items-center justify-end gap-1.5 text-[11px]">
                                            <div className="min-w-0 text-right">
                                                <span className="font-semibold text-gray-900 truncate block">
                                                    {injury.player?.name}
                                                </span>
                                                <span className="text-[10px] text-gray-500 capitalize truncate block">
                                                    {injury.player?.reason || injury.player?.type || "Unavailable"}
                                                </span>
                                            </div>
                                            {getInjuryIcon(injury.player?.reason)}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-[10px] text-gray-400 italic text-right">No reported injuries</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
