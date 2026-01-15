
import React from "react";
import Image from "next/image";

interface Team {
    id: number;
    name: string;
    logo: string;
    form?: { result: string; color: string }[];
    last5Matches?: any[];
}

interface TeamDisplayProps {
    homeTeam: Team;
    awayTeam: Team;
    status: string;
    // displayDate usually contains time or "FT"
    displayDate: string;
    venue?: string;
    date: string; // ISO date string
    score?: { home: number | null; away: number | null };
    tip?: string | null;
}

const TeamDisplay: React.FC<TeamDisplayProps> = ({
    homeTeam,
    awayTeam,
    status,
    displayDate,
    venue,
    score,
    tip,
}) => {
    // Check if match is live/active to apply red color
    const isLive = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(status);
    const isFinished = ["FT", "AET", "PEN"].includes(status);

    // Tip Validation Logic (Matches FixtureCard)
    const getTipStatus = (tVal: string) => {
        if (!score || score.home === null || score.away === null || status === "NS") return "PENDING";

        const h = Number(score.home);
        const a = Number(score.away);
        const t = tVal.trim().toUpperCase();

        if (t === "1") return h > a ? "WIN" : "LOSS";
        if (t === "2") return a > h ? "WIN" : "LOSS";
        if (t === "X") return h === a ? "WIN" : "LOSS";
        if (t === "1X") return h >= a ? "WIN" : "LOSS";
        if (t === "X2") return a >= h ? "WIN" : "LOSS";
        if (t === "12") return h !== a ? "WIN" : "LOSS";

        // Basic Over/Under Support
        if (t.startsWith("OVER")) {
            const line = parseFloat(t.split(" ")[1]);
            if (!isNaN(line)) return (h + a) > line ? "WIN" : "LOSS";
        }
        if (t.startsWith("UNDER")) {
            const line = parseFloat(t.split(" ")[1]);
            if (!isNaN(line)) return (h + a) < line ? "WIN" : "LOSS";
        }

        return "PENDING";
    };

    let tipColorClass = "text-orange-400 bg-orange-900/20 border-orange-500/20";
    if (tip && tip !== "N/A") {
        const s = getTipStatus(tip);
        if (s === "WIN") tipColorClass = "text-green-400 bg-green-900/40 border-green-500/20";
        if (s === "LOSS") tipColorClass = "text-red-400 bg-red-900/20 border-red-500/20";
    }

    const renderFormBars = (forms: { result: string; color: string }[]) => {
        if (!forms || !Array.isArray(forms) || forms.length === 0) return null;

        return (
            <div className="flex justify-center gap-1 mt-1">
                {forms.map((m, idx) => (
                    <span
                        key={idx}
                        className="rounded-sm text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center"
                        style={{ backgroundColor: m.color }}
                    >
                        {m.result}
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center mb-3 text-white bg-[#1F1F1F] p-2 rounded-xl shadow-sm border border-white/5">
            {/* League/Header info is usually above this component, so we just show teams here */}

            <div className="grid grid-cols-3 items-center gap-1 sm:gap-2 max-w-lg w-full">
                {/* Home */}
                <div className="flex flex-col items-center">
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 mb-2">
                        <Image
                            src={homeTeam?.logo}
                            alt={homeTeam?.name}
                            fill
                            className="object-contain"
                            unoptimized
                        />
                    </div>
                    <span className="font-bold text-center text-xs sm:text-sm text-gray-200 leading-tight">
                        {homeTeam.name}
                    </span>
                    {homeTeam.form && renderFormBars(homeTeam.form)}
                </div>

                {/* Center - Score/Time */}
                <div className="flex flex-col items-center justify-center text-center">

                    {/* TIP Display - Above Score/Time */}
                    {tip && tip !== "N/A" && (
                        <div className={`mb-2 border px-3 py-1 rounded text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-1 ${tipColorClass}`}>
                            Tip: {tip}
                        </div>
                    )}

                    {score ? (
                        <div className="flex flex-col items-center">
                            {/* Score */}
                            <div className={`text-2xl sm:text-3xl font-bold tracking-wider ${isLive ? "text-red-500" : "text-gray-200"}`}>
                                {score.home} - {score.away}
                            </div>

                            {/* Status / Date */}
                            <div className={`text-xs font-bold mt-1 ${isLive ? "text-red-500 animate-pulse" : "text-gray-400"}`}>
                                {isFinished ? "Full Time" : displayDate}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="text-sm font-bold text-gray-400">
                                {displayDate}
                            </div>
                        </div>
                    )}
                </div>

                {/* Away */}
                <div className="flex flex-col items-center">
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 mb-2">
                        <Image
                            src={awayTeam?.logo}
                            alt={awayTeam?.name}
                            fill
                            className="object-contain"
                            unoptimized
                        />
                    </div>
                    <span className="font-bold text-center text-xs sm:text-sm text-gray-200 leading-tight">
                        {awayTeam.name}
                    </span>
                    {awayTeam.form && renderFormBars(awayTeam.form)}
                </div>
            </div>

            {venue && (
                <p className="mt-4 text-gray-500 text-[10px] sm:text-xs text-center border-t border-white/10 pt-2 w-full max-w-xs">
                    🏟 {venue}
                </p>
            )}
        </div>
    );
};

export default TeamDisplay;
