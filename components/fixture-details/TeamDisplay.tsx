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
    displayDate: string;
    venue?: string;
    date: string;
    score?: { home: number | null; away: number | null };
    tip?: string | null;
}

const TeamDisplay: React.FC<TeamDisplayProps> = ({
    homeTeam,
    awayTeam,
    status,
    displayDate,
    date,
    venue,
    score,
    tip,
}) => {
    const isLive = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(status);
    const isFinished = ["FT", "AET", "PEN"].includes(status);
    const kickoffTime = new Date(date).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Africa/Nairobi",
    });

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

    let tipBadge = null;
    if (tip && tip !== "N/A") {
        const s = getTipStatus(tip);
        let colors = "text-orange-300 bg-orange-500/20 border-orange-500/30";
        let icon = "🎯";
        if (s === "WIN") {
            colors = "text-emerald-300 bg-emerald-500/20 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
            icon = "✅";
        }
        if (s === "LOSS") {
            colors = "text-rose-300 bg-rose-500/20 border-rose-500/30";
            icon = "❌";
        }

        tipBadge = (
            <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border animate-in zoom-in duration-500 ${colors}`}>
                <span>{icon}</span> Tip: {tip}
            </div>
        );
    }

    return (
        <div className="relative w-full overflow-hidden rounded-2xl mb-6 bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#1e1b4b] border border-white/10 shadow-2xl">

            {/* Subtle Abstract Background Glows */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full mix-blend-screen filter blur-[80px] opacity-50 translate-x-[-20%] translate-y-[-20%]"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full mix-blend-screen filter blur-[80px] opacity-50 translate-x-[20%] translate-y-[20%]"></div>

            {/* Main Content */}
            <div className="relative z-10 p-6 sm:p-8 flex flex-col items-center">

                {/* Scoreboard Area */}
                <div className="flex items-center justify-between w-full max-w-2xl mx-auto">

                    {/* Home Team */}
                    <div className="flex flex-col items-center flex-1">
                        <div className="relative w-16 h-16 sm:w-24 sm:h-24 mb-3 filter drop-shadow-lg transition-transform hover:scale-105 duration-300">
                            <Image src={homeTeam?.logo} alt={homeTeam?.name} fill className="object-contain" unoptimized />
                        </div>
                        <h2 className="font-extrabold text-center text-sm sm:text-xl text-white tracking-wide drop-shadow-md">
                            {homeTeam.name}
                        </h2>
                    </div>

                    {/* Center Info (Score & Time) */}
                    <div className="flex flex-col items-center justify-center flex-shrink-0 px-2 sm:px-6">
                        {score ? (
                            <div className="flex flex-col items-center">
                                <div className={`text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] flex items-center gap-3 ${isLive ? "text-rose-500" : "text-white"}`}>
                                    <span>{score.home}</span>
                                    <span className="text-white/20 text-3xl sm:text-4xl">-</span>
                                    <span>{score.away}</span>
                                </div>
                                <div className={`mt-2 text-xs sm:text-sm font-bold tracking-widest uppercase px-3 py-1 rounded-full backdrop-blur-md bg-white/5 border border-white/10 ${isLive ? "text-rose-400 animate-pulse border-rose-500/30 bg-rose-500/10" : "text-gray-300"}`}>
                                    {isFinished ? `FT • ${kickoffTime}` : displayDate}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="text-3xl sm:text-5xl font-black text-white/10 mb-2 tracking-widest">v</div>
                                <div className="text-xs sm:text-sm font-semibold tracking-widest text-[#94a3b8] uppercase bg-white/5 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/5">
                                    {displayDate}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Away Team */}
                    <div className="flex flex-col items-center flex-1">
                        <div className="relative w-16 h-16 sm:w-24 sm:h-24 mb-3 filter drop-shadow-lg transition-transform hover:scale-105 duration-300">
                            <Image src={awayTeam?.logo} alt={awayTeam?.name} fill className="object-contain" unoptimized />
                        </div>
                        <h2 className="font-extrabold text-center text-sm sm:text-xl text-white tracking-wide drop-shadow-md">
                            {awayTeam.name}
                        </h2>
                    </div>

                </div>

                {/* Prediction Tip Badge */}
                {tipBadge}

                {/* Match Info Footer (Venue) */}
                {venue && (
                    <div className="mt-6 flex items-center justify-center text-[#64748b] text-[10px] sm:text-xs tracking-wider uppercase">
                        <span className="mr-1">🏟</span> {venue}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamDisplay;
