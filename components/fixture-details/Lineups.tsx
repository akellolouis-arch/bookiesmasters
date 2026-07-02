import React from "react";

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
    coach: {
        id: number;
        name: string;
        photo: string;
    };
}

import FootballPitch from "./FootballPitch";

interface LineupsProps {
    lineups: Lineup[];
}

export default function Lineups({ lineups }: LineupsProps) {
    if (!lineups || lineups.length === 0) {
        return (
            <div className="p-6 text-center text-gray-500">
                <p>Lineups not available yet.</p>
                <p className="text-xs mt-2">Lineups are usually announced 45-60 mins before kickoff.</p>
            </div>
        );
    }

    const [home, away] = lineups;

    // Check if we have grid data for visualization
    // We check the first player of home team
    const hasGridData = home.startXI[0]?.player.grid !== null;

    return (
        <div className="p-4 space-y-8">
            {/* Team Headers & Formation */}
            <div className="flex justify-between items-center px-4">
                <div className="text-center">
                    <p className="font-bold text-main-accent">{home.formation}</p>
                    <p className="text-xs text-gray-600">{home.team.name}</p>
                </div>
                <div className="text-center">
                    <span className="text-xs text-gray-500 px-2 py-1 bg-gray-900 rounded">FORMATION</span>
                </div>
                <div className="text-center">
                    <p className="font-bold text-main-accent">{away.formation}</p>
                    <p className="text-xs text-gray-600">{away.team.name}</p>
                </div>
            </div>

            {/* 🔥 VISUAL PITCH (If Grid Available) */}
            {hasGridData && (
                <div className="mb-8">
                    <FootballPitch home={home} away={away} />
                </div>
            )}

            {/* Starting XI List (Fallback or Complementary? User visual replaces list mostly, 
                but keeping list below or hidden is safer. Let's SHOW list if NO grid, or maybe always show sub list)
                
                Strategy: If Visual Pitch ON, maybe hide StartXI list to avoid duplication? 
                Or keep it for "List View" preference? 
                For now, let's keep the list as well for completeness, or maybe just toggled?
                User asked to "let be a diagram", implying replacement.
                But Substitutes MUST be list.
            */}

            {!hasGridData && (
                /* Starting XI Lists Comparison (Only show if NO pitch) */
                <div className="grid grid-cols-2 gap-4">
                    {/* Home XI */}
                    <div>
                        <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-3 border-b border-gray-200 pb-2">Starting XI</h4>
                        <ul className="space-y-2">
                            {home.startXI.map((item, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-sm">
                                    <span className="w-5 text-gray-500 text-xs">{item.player.number}</span>
                                    <span className="text-gray-900 truncate">{item.player.name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Away XI */}
                    <div>
                        <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-3 border-b border-gray-200 pb-2 text-right">Starting XI</h4>
                        <ul className="space-y-2">
                            {away.startXI.map((item, idx) => (
                                <li key={idx} className="flex items-center justify-end gap-2 text-sm">
                                    <span className="text-gray-900 truncate text-right">{item.player.name}</span>
                                    <span className="w-5 text-gray-500 text-xs text-right">{item.player.number}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Substitutes Lists Comparison */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                {/* Home Subs */}
                <div>
                    <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-3">Substitutes</h4>
                    <ul className="space-y-2">
                        {home.substitutes.map((item, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                                <span className="w-5 text-gray-600">{item.player.number}</span>
                                <span className="truncate">{item.player.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Away Subs */}
                <div>
                    <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-3 text-right">Substitutes</h4>
                    <ul className="space-y-2">
                        {away.substitutes.map((item, idx) => (
                            <li key={idx} className="flex items-center justify-end gap-2 text-xs text-gray-700">
                                <span className="truncate text-right">{item.player.name}</span>
                                <span className="w-5 text-gray-600 text-right">{item.player.number}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Coaches */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="text-xs">
                    <span className="text-gray-500">Coach:</span> <span className="text-gray-900">{home.coach.name}</span>
                </div>
                <div className="text-xs">
                    <span className="text-gray-500">Coach:</span> <span className="text-gray-900">{away.coach.name}</span>
                </div>
            </div>
        </div>
    );
}
