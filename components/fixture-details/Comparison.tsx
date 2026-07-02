import React from 'react';

interface Stats {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    avgGoalsFor: string;
    avgGoalsAgainst: string;
    bttsPct: number;
    over25Pct: number;
    cleanSheetPct: number;
}

interface ComparisonProps {
    data: {
        home: Stats | null;
        away: Stats | null;
    };
    homeTeamName: string;
    awayTeamName: string;
}

export default function Comparison({ data, homeTeamName, awayTeamName }: ComparisonProps) {
    if (!data || !data.home || !data.away) return null;

    const { home, away } = data;

    const StatRow = ({ label, homeValue, awayValue, type = 'text' }: {
        label: string,
        homeValue: string | number,
        awayValue: string | number,
        type?: 'text' | 'bar'
    }) => {
        // Parse for comparison logic highlighting
        const hVal = parseFloat(String(homeValue));
        const aVal = parseFloat(String(awayValue));

        const homeActive = hVal > aVal ? 'text-green-400 font-bold' : 'text-gray-600';
        const awayActive = aVal > hVal ? 'text-green-400 font-bold' : 'text-gray-600';

        // For Bar: total = 100% usually, or max of the two
        const max = Math.max(hVal, aVal) || 1;
        const hPercent = (hVal / max) * 100;
        const aPercent = (aVal / max) * 100;

        return (
            <div className="flex flex-col gap-1 mb-3">
                <div className="flex justify-between text-xs uppercase tracking-wider text-gray-500">
                    <span className={homeActive}>{homeValue}{type === 'bar' ? '%' : ''}</span>
                    <span>{label}</span>
                    <span className={awayActive}>{awayValue}{type === 'bar' ? '%' : ''}</span>
                </div>
                {/* Bar Visual */}
                <div className="flex bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    {/* Home Bar (Right Aligned visually? No, Left to Center) */}
                    <div className="flex-1 flex justify-end gap-0.5 transform scale-x-[-1]">
                        {/* We use scale-x-[-1] to flip it so it grows from center outward if we want center spine */}
                        {/* Simpler: Two separate bars growing from center */}
                    </div>
                </div>

                {/* Better Bar Design: Center Spine */}
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                    {/* Home Bar (Right Aligned) */}
                    <div className="h-1.5 w-full bg-zinc-800 rounded-l-full flex justify-end">
                        <div
                            className={`h-full rounded-l-full transition-all duration-500 ${hVal > aVal ? 'bg-green-500' : 'bg-zinc-600'}`}
                            style={{ width: `${type === 'bar' ? homeValue : (hVal / (hVal + aVal || 1)) * 100}%` }}
                        ></div>
                    </div>

                    {/* Spine */}
                    <div className="w-1 h-3 bg-zinc-800/50"></div>

                    {/* Away Bar (Left Aligned) */}
                    <div className="h-1.5 w-full bg-zinc-800 rounded-r-full flex justify-start">
                        <div
                            className={`h-full rounded-r-full transition-all duration-500 ${aVal > hVal ? 'bg-blue-500' : 'bg-zinc-600'}`}
                            style={{ width: `${type === 'bar' ? awayValue : (aVal / (hVal + aVal || 1)) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-zinc-900/50 rounded-xl overflow-hidden mb-6 border border-zinc-800 p-4">
            <h3 className="text-sm font-bold text-center text-gray-800 mb-6 uppercase tracking-widest border-b border-zinc-800 pb-2">
                Statistical Comparison
            </h3>

            <div className="space-y-6">
                {/* Form Stats */}
                <div className="space-y-2">
                    <StatRow label="Wins (Last 5)" homeValue={home.wins} awayValue={away.wins} />
                    <StatRow label="Avg Goals Scored" homeValue={home.avgGoalsFor} awayValue={away.avgGoalsFor} />
                    <StatRow label="Avg Goals Conceded" homeValue={home.avgGoalsAgainst} awayValue={away.avgGoalsAgainst} />
                </div>

                <div className="h-px bg-zinc-800/50"></div>

                {/* Probabilities */}
                <div className="space-y-2">
                    <StatRow label="BTTS %" homeValue={home.bttsPct} awayValue={away.bttsPct} type="bar" />
                    <StatRow label="Over 2.5 Goals %" homeValue={home.over25Pct} awayValue={away.over25Pct} type="bar" />
                    <StatRow label="Clean Sheet %" homeValue={home.cleanSheetPct} awayValue={away.cleanSheetPct} type="bar" />
                </div>
            </div>

            <div className="mt-4 text-[10px] text-center text-gray-600 uppercase">
                Based on last {home.played} matches
            </div>
        </div>
    );
}
