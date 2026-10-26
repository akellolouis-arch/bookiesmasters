"use client";

import React from "react";
import Image from "next/image";

interface StatItem {
    type: string;
    value: string | number | null;
}

interface TeamStats {
    team: {
        id: number;
        name: string;
        logo: string;
    };
    statistics: StatItem[];
}

interface StatisticsProps {
    stats: TeamStats[];
}

export default function Statistics({ stats }: StatisticsProps) {
    if (!stats || stats.length < 2) {
        return (
            <div className="p-6 text-center text-gray-500 bg-white rounded-xl shadow-xs border border-gray-200 max-w-2xl mx-auto my-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2 text-gray-400">
                    📊
                </div>
                <p className="text-xs font-semibold text-gray-700">No match statistics available yet</p>
                <p className="text-[11px] text-gray-400 mt-1">
                    Detailed in-match statistics (possession, shots, corners, fouls) are provided during and after the game.
                </p>
            </div>
        );
    }

    const home = stats[0];
    const away = stats[1];

    // Helper to get value safely
    const getVal = (teamStat: TeamStats, type: string) => {
        const item = teamStat.statistics?.find((s) => s.type.toLowerCase() === type.toLowerCase());
        return item?.value ?? 0;
    };

    // List of stats to display
    const statTypes = [
        { label: "Ball Possession", key: "Ball Possession", isPercent: true },
        { label: "Expected Goals (xG)", key: "expected_goals", isPercent: false },
        { label: "Total Shots", key: "Total Shots", isPercent: false },
        { label: "Shots on Goal", key: "Shots on Goal", isPercent: false },
        { label: "Shots off Goal", key: "Shots off Goal", isPercent: false },
        { label: "Blocked Shots", key: "Blocked Shots", isPercent: false },
        { label: "Corner Kicks", key: "Corner Kicks", isPercent: false },
        { label: "Fouls", key: "Fouls", isPercent: false },
        { label: "Yellow Cards", key: "Yellow Cards", isPercent: false },
        { label: "Red Cards", key: "Red Cards", isPercent: false },
        { label: "Offsides", key: "Offsides", isPercent: false },
        { label: "Goalkeeper Saves", key: "Goalkeeper Saves", isPercent: false },
        { label: "Total Passes", key: "Total passes", isPercent: false },
        { label: "Pass Accuracy", key: "Passes %", isPercent: true },
    ];

    return (
        <div className="bg-white rounded-xl shadow-xs p-3 sm:p-5 max-w-2xl mx-auto border border-gray-200 my-3">
            {/* Header: Home vs Away */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                <div className="flex items-center gap-1.5 min-w-0 max-w-[42%]">
                    {home.team?.logo && (
                        <Image
                            src={home.team.logo}
                            alt={home.team.name}
                            width={16}
                            height={16}
                            className="w-4 h-4 object-contain shrink-0"
                            unoptimized
                        />
                    )}
                    <span className="text-[11px] sm:text-[12px] font-bold text-gray-900 truncate">
                        {home.team?.name}
                    </span>
                </div>

                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Match Stats
                </span>

                <div className="flex items-center justify-end gap-1.5 min-w-0 max-w-[42%] text-right">
                    <span className="text-[11px] sm:text-[12px] font-bold text-gray-900 truncate">
                        {away.team?.name}
                    </span>
                    {away.team?.logo && (
                        <Image
                            src={away.team.logo}
                            alt={away.team.name}
                            width={16}
                            height={16}
                            className="w-4 h-4 object-contain shrink-0"
                            unoptimized
                        />
                    )}
                </div>
            </div>

            {/* Stats List */}
            <div className="space-y-3">
                {statTypes.map(({ label, key, isPercent }) => {
                    const val1Raw = getVal(home, key);
                    const val2Raw = getVal(away, key);

                    if (val1Raw === 0 && val2Raw === 0 && key === "expected_goals") {
                        // Skip xG if not recorded
                        return null;
                    }

                    const val1Num =
                        typeof val1Raw === "string"
                            ? parseFloat(val1Raw.replace("%", "")) || 0
                            : Number(val1Raw) || 0;
                    const val2Num =
                        typeof val2Raw === "string"
                            ? parseFloat(val2Raw.replace("%", "")) || 0
                            : Number(val2Raw) || 0;

                    const total = val1Num + val2Num;
                    const pct1 = total === 0 ? 50 : Math.max(10, Math.min(90, (val1Num / total) * 100));
                    const pct2 = 100 - pct1;

                    const isHomeHigher = val1Num > val2Num;
                    const isAwayHigher = val2Num > val1Num;

                    return (
                        <div key={key} className="flex flex-col gap-1">
                            {/* Values & Label */}
                            <div className="flex justify-between items-center text-[11px] sm:text-[12px] px-1">
                                <span
                                    className={`font-semibold min-w-[32px] text-left ${
                                        isHomeHigher ? "text-teal-700 font-bold" : "text-gray-700"
                                    }`}
                                >
                                    {val1Raw}
                                </span>
                                <span className="text-gray-500 font-medium text-[10px] sm:text-[11px] text-center tracking-wide uppercase">
                                    {label}
                                </span>
                                <span
                                    className={`font-semibold min-w-[32px] text-right ${
                                        isAwayHigher ? "text-indigo-600 font-bold" : "text-gray-700"
                                    }`}
                                >
                                    {val2Raw}
                                </span>
                            </div>

                            {/* Sofascore-style Visual Bar */}
                            <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-gray-100 gap-0.5">
                                <div
                                    className={`h-full rounded-l-full transition-all duration-500 ${
                                        isHomeHigher ? "bg-teal-500" : "bg-teal-300/80"
                                    }`}
                                    style={{ width: `${pct1}%` }}
                                />
                                <div
                                    className={`h-full rounded-r-full transition-all duration-500 ${
                                        isAwayHigher ? "bg-indigo-500" : "bg-indigo-300/80"
                                    }`}
                                    style={{ width: `${pct2}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
