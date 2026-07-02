"use client";

import React from "react";

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
            <div className="p-4 text-center text-gray-500 bg-white rounded-lg shadow-sm border border-gray-200">
                <p className="text-xs">No statistics available yet.</p>
            </div>
        );
    }

    const home = stats[0];
    const away = stats[1];

    // Helper to get value safely
    const getVal = (teamStat: TeamStats, type: string) => {
        const item = teamStat.statistics.find(s => s.type === type);
        return item?.value ?? 0;
    };

    // List of stats to display
    const statTypes = [
        "Ball Possession",
        "Total Shots",
        "Shots on Goal",
        "Shots off Goal",
        "Corner Kicks",
        "Fouls",
        "Yellow Cards",
        "Red Cards",
        "Offsides",
        "Goalkeeper Saves",
        "Passes %"
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm p-4 max-w-2xl mx-auto border border-gray-200">

            {/* Header / Team Logos */}


            {/* Stats List */}
            <div className="space-y-3">
                {statTypes.map((type) => {
                    // Extract raw values
                    const val1Raw = getVal(home, type);
                    const val2Raw = getVal(away, type);

                    // Normalize for percentages (Possession, Passes)
                    // If string contains '%', parse it
                    const val1Num = typeof val1Raw === 'string' ? parseFloat(val1Raw) : Number(val1Raw);
                    const val2Num = typeof val2Raw === 'string' ? parseFloat(val2Raw) : Number(val2Raw);

                    const total = val1Num + val2Num;
                    const pct1 = total === 0 ? 0 : (val1Num / total) * 100;
                    const pct2 = total === 0 ? 0 : (val2Num / total) * 100;

                    return (
                        <div key={type} className="flex flex-col gap-1">
                            {/* Values & Label */}
                            <div className="flex justify-between text-[11px] font-semibold text-gray-700 px-1">
                                <span>{val1Raw}</span>
                                <span className="text-gray-500 font-normal">{type}</span>
                                <span>{val2Raw}</span>
                            </div>

                            {/* Bars */}
                            <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-gray-800">
                                <div
                                    className={`h-full ${val1Num >= val2Num ? 'bg-teal-400' : 'bg-white'}`}
                                    style={{ width: `${pct1}%` }}
                                />
                                <div
                                    className={`h-full ${val2Num > val1Num ? 'bg-teal-400' : 'bg-white'}`}
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
