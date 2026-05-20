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
    score?: { home: number | null; away: number | null } | null;
    tip?: string | null;
    league?: string;
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
    league,
}) => {
    const isLive = status ? ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(status) : false;
    const isFinished = status ? ["FT", "AET", "PEN"].includes(status) : false;
    
    const dateObj = new Date(date);
    const kickoffTime = dateObj.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Africa/Nairobi",
    });
    const formattedDate = dateObj.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Africa/Nairobi",
    });

    // Form bubble renderer
    const renderForm = (last5Matches?: any[]) => {
        if (!last5Matches || last5Matches.length === 0) return null;
        return (
            <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5 mt-2 px-1">
                {last5Matches.map((m, i) => {
                    const res = m.result || "D";
                    let bgClass = "bg-[#eab308]"; // Yellow for Draw
                    if (res === "W") bgClass = "bg-[#16a34a]"; // Green for Win
                    if (res === "L") bgClass = "bg-[#dc2626]"; // Red for Loss

                    return (
                        <div key={i} className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 rounded-full text-[8px] sm:text-[10px] font-bold flex items-center justify-center text-white ${bgClass} shadow-sm`}>
                            {res}
                        </div>
                    );
                })}
            </div>
        );
    };

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
        let colors = "border-orange-500 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.2)] bg-orange-500/10";
        if (s === "WIN") {
            colors = "border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)] bg-emerald-500/10";
        }
        if (s === "LOSS") {
            colors = "border-[#b91c1c] text-[#f87171] shadow-[0_0_12px_rgba(185,28,28,0.2)] bg-[#7f1d1d]/10";
        }

        tipBadge = (
            <div className={`mb-4 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border-2 font-bold text-[10px] sm:text-sm flex items-center justify-center ${colors}`}>
                {tip}
            </div>
        );
    }

    return (
        <div className="relative w-full py-2 sm:py-4 flex flex-col items-center bg-transparent">

            <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
                
                {/* TOP HEADER: Names & Venue */}
                <div className="text-center mb-3 px-4">
                    {/* League Badge (Moved to Top) */}
                    {league && (
                        <div className="mb-3 inline-block px-3 sm:px-5 py-1 bg-white/5 backdrop-blur-sm border border-white/10 text-gray-200 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold shadow-lg tracking-wide uppercase">
                            {league}
                        </div>
                    )}
                    <h1 className="text-base sm:text-lg md:text-xl font-normal text-white tracking-wide">
                        {homeTeam.name} <span className="font-bold mx-1 sm:mx-3 text-white">VS</span> {awayTeam.name}
                    </h1>
                    {venue && (
                        <div className="mt-2 text-[10px] sm:text-xs text-gray-400 font-medium flex items-center justify-center gap-1.5 lowercase">
                            <span>🏟</span> {venue}
                        </div>
                    )}
                </div>

                {/* MIDDLE ROW: Logos & Score */}
                <div className="flex items-start justify-center w-full px-1 sm:px-4 gap-2 sm:gap-4 md:gap-8">
                    
                    {/* HOME TEAM */}
                    <div className="flex flex-col items-center flex-1 min-w-0">
                        {/* Logo Card */}
                        <div className="w-20 h-24 sm:w-28 sm:h-32 md:w-32 md:h-36 bg-white/5 rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 flex items-center justify-center p-3 sm:p-4 shadow-lg backdrop-blur-sm">
                            <div className="relative w-full h-full filter drop-shadow-md">
                                <Image src={homeTeam?.logo} alt={homeTeam?.name} fill className="object-contain" unoptimized />
                            </div>
                        </div>
                        {/* Form */}
                        {renderForm(homeTeam.last5Matches)}
                    </div>

                    {/* CENTER INFO */}
                    <div className="flex flex-col items-center justify-start mt-1 sm:mt-2 min-w-[100px] sm:min-w-[140px]">
                        {/* Date & Time */}
                        <div className="text-[10px] sm:text-sm text-gray-300 font-semibold mb-3 tracking-wide whitespace-nowrap">
                            {formattedDate} <span className="ml-1">{kickoffTime}</span>
                        </div>
                        
                        {/* Tip Badge (Red Circle/Pill) */}
                        {tipBadge}

                        {/* Score Box */}
                        {score ? (
                            <div className="flex flex-col items-center">
                                <div className={`bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl px-4 sm:px-6 py-2 sm:py-3 shadow-lg flex items-center justify-center gap-2 sm:gap-4 border border-white/10 ${isLive ? "animate-pulse" : ""}`}>
                                    <span className={`text-2xl sm:text-4xl font-black ${isLive ? "text-rose-500" : "text-white"}`}>{score.home}</span>
                                    <span className="text-xl sm:text-2xl font-bold text-gray-400">-</span>
                                    <span className={`text-2xl sm:text-4xl font-black ${isLive ? "text-rose-500" : "text-white"}`}>{score.away}</span>
                                </div>
                                <div className={`mt-2 text-[10px] sm:text-xs font-bold tracking-widest uppercase ${isLive ? "text-rose-500 animate-pulse" : "text-gray-400"}`}>
                                    {isFinished ? "FT" : (isLive && displayDate ? displayDate : status)}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center mt-2">
                                <div className="bg-white/10 rounded-xl sm:rounded-2xl px-6 sm:px-8 py-3 flex items-center justify-center border border-white/5 backdrop-blur-md">
                                    <span className="text-2xl sm:text-4xl font-black text-gray-500">-</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* AWAY TEAM */}
                    <div className="flex flex-col items-center flex-1 min-w-0">
                        {/* Logo Card */}
                        <div className="w-20 h-24 sm:w-28 sm:h-32 md:w-32 md:h-36 bg-white/5 rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 flex items-center justify-center p-3 sm:p-4 shadow-lg backdrop-blur-sm">
                            <div className="relative w-full h-full filter drop-shadow-md">
                                <Image src={awayTeam?.logo} alt={awayTeam?.name} fill className="object-contain" unoptimized />
                            </div>
                        </div>
                        {/* Form */}
                        {renderForm(awayTeam.last5Matches)}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TeamDisplay;

