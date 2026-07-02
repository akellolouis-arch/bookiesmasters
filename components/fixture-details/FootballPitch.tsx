"use client";

import React from "react";
import Image from "next/image";

interface Player {
    id: number;
    name: string;
    number: number;
    pos: string;
    grid: string | null; // "3:1" format
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
}

interface FootballPitchProps {
    home: Lineup;
    away: Lineup;
}

export default function FootballPitch({ home, away }: FootballPitchProps) {
    // Helper to parse grid "R:C"
    // API Grid: 1:1 (GK), 2:1 (Def), etc.
    // Max Rows usually 5 or 6?
    const parseGrid = (grid: string | null) => {
        if (!grid) return { r: 1, c: 1 };
        const [r, c] = grid.split(":").map(Number);
        return { r, c };
    };

    /**
     * Improved positioning: Group players by ROW to center them properly
     */
    const renderTeam = (lineup: Lineup, isHome: boolean) => {
        // Group players by Row
        const rows: { [key: number]: Player[] } = {};

        lineup.startXI.forEach(p => {
            const { r } = parseGrid(p.player.grid);
            if (!rows[r]) rows[r] = [];
            rows[r].push(p.player);
        });

        return Object.keys(rows).map((rowKey) => {
            const r = Number(rowKey);
            const playersInRow = rows[r];

            // Sort by Column if provided, else keep array order
            playersInRow.sort((a, b) => {
                const cA = parseGrid(a.grid).c;
                const cB = parseGrid(b.grid).c;
                return cA - cB;
            });

            // Calculate Vertical Position for this ROW
            // Enforce halves: Home (Left/First) -> Top (0-50%), Away (Right/Second) -> Bottom (50-100%)
            let top = isHome
                ? 10 + (r - 1) * 10 // Home: 10, 20, 30, 40, 50 (Top Half)
                : 90 - (r - 1) * 10; // Away: 90, 80, 70, 60, 50 (Bottom Half)

            return (
                <div
                    key={r}
                    className="absolute w-full flex justify-center items-center px-4"
                    style={{ top: `${top}%`, height: "30px" }} // Flex row container at specific height
                >
                    {/* Render players in this row (Horizontal distribution) */}
                    {playersInRow.map((player) => (
                        <div key={player.id} className="flex flex-col items-center mx-2 sm:mx-4 w-16 group cursor-pointer relative z-10">
                            {/* Shirt/Dot */}
                            <div
                                className={`
                                    w-7 h-7 sm:w-8 sm:h-8 rounded-full 
                                    flex items-center justify-center 
                                    text-[10px] font-bold shadow-md border-2
                                    ${isHome ? "bg-white text-black border-gray-300" : "bg-main-accent text-gray-900 border-blue-900"}
                                    transition-transform transform group-hover:scale-110
                                `}
                            >
                                {player.number}
                            </div>

                            {/* Name Label */}
                            <span className="mt-1 text-[9px] sm:text-[10px] text-gray-900 font-medium bg-gray-50/50 px-1 rounded truncate max-w-[80px]">
                                {player.name.split(" ").pop()} {/* Last name only for compactness */}
                            </span>
                        </div>
                    ))}
                </div>
            )
        });
    };

    return (
        <div className="relative w-full max-w-lg mx-auto h-[600px] bg-green-600 rounded-xl overflow-hidden shadow-inner border border-green-800">
            {/* Pitch Background Graphics */}
            {/* Grass Patterns */}
            <div className="absolute inset-0 bg-gradient-to-b from-green-700 via-green-600 to-green-700 opacity-100"></div>

            {/* Horizontal Mowing Lines */}
            <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(0,0,0,0.05) 50px, rgba(0,0,0,0.05) 99px)" }}></div>

            {/* Center Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/40"></div>

            {/* Center Circle */}
            <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-white/40 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>

            {/* Center Spot */}
            <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-white/60 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>

            {/* Penalty Areas */}
            {/* Top (Away) */}
            <div className="absolute top-0 left-1/2 w-48 h-24 border-b-2 border-x-2 border-white/40 transform -translate-x-1/2 rounded-b-md"></div>
            <div className="absolute top-0 left-1/2 w-20 h-8 border-b-2 border-x-2 border-white/40 transform -translate-x-1/2 rounded-b-sm bg-gray-100"></div>

            {/* Bottom (Home) */}
            <div className="absolute bottom-0 left-1/2 w-48 h-24 border-t-2 border-x-2 border-white/40 transform -translate-x-1/2 rounded-t-md"></div>
            <div className="absolute bottom-0 left-1/2 w-20 h-8 border-t-2 border-x-2 border-white/40 transform -translate-x-1/2 rounded-t-sm bg-gray-100"></div>

            {/* Corner Arcs */}
            <div className="absolute top-0 left-0 w-4 h-4 border-b-2 border-r-2 border-white/40 rounded-br-full"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-b-2 border-l-2 border-white/40 rounded-bl-full"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-t-2 border-r-2 border-white/40 rounded-tr-full"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-t-2 border-l-2 border-white/40 rounded-tl-full"></div>

            {/* TEAM RENDERERS */}
            {/* Home Team (Top) */}
            <div className="absolute inset-0 z-10">
                {renderTeam(home, true)}
            </div>

            {/* Away Team (Bottom) */}
            <div className="absolute inset-0 z-10">
                {renderTeam(away, false)}
            </div>

            {/* Team Logos Overlay (Subtle) */}
            <div className="absolute top-4 left-4 opacity-30">
                {/* <Image src={away.team.logo} width={40} height={40} alt="Away" /> */}
            </div>
            <div className="absolute bottom-4 right-4 opacity-30">
                {/* <Image src={home.team.logo} width={40} height={40} alt="Home" /> */}
            </div>
        </div>
    );
}
