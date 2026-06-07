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
    score?: { home: number | null; away: number | null; halftime?: { home: number | null; away: number | null } } | null;
    league?: string;
    isLoading?: boolean;
    tip?: string;
}

const TeamDisplay: React.FC<TeamDisplayProps> = ({
    homeTeam,
    awayTeam,
    status,
    displayDate,
    date,
    venue,
    score,
    league,
    isLoading,
    tip,
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

    let scoreColorClass = "text-white";
    let dashColorClass = "text-gray-400";
    let noScoreColorClass = "text-gray-500";
    
    if (tip) {
        if (!isFinished && !isLive) {
            scoreColorClass = "text-orange-300";
            dashColorClass = "text-orange-300";
            noScoreColorClass = "text-orange-300";
        } else if (isFinished && score && score.home !== null && score.away !== null) {
            const totalGoals = score.home + score.away;
            let isWon = false;
            let isValidTip = false;
            
            if (tip.includes("Over 1.5") || tip.includes("OV1.5")) {
                isWon = totalGoals > 1.5;
                isValidTip = true;
            } else if (tip.includes("Over 2.5") || tip.includes("OV2.5")) {
                isWon = totalGoals > 2.5;
                isValidTip = true;
            } else if (tip.includes("Under 2.5") || tip.includes("UN2.5")) {
                isWon = totalGoals < 2.5;
                isValidTip = true;
            } else if (tip.includes("Under 3.5") || tip.includes("UN3.5")) {
                isWon = totalGoals < 3.5;
                isValidTip = true;
            }
            
            if (isValidTip) {
                scoreColorClass = isWon ? "text-[#22c55e]" : "text-[#ef4444]";
                dashColorClass = scoreColorClass;
            }
        }
    }

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



    return (
        <div className="relative w-full pb-2 sm:pb-4 flex flex-col items-center bg-transparent">

            <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
                
                {/* TOP HEADER: Names & Venue */}
                <div className="text-center mb-1 px-4">
                    {/* League Badge (Moved to Top) */}
                    {league && (
                        <div className="mb-1 inline-block px-3 sm:px-5 py-1 bg-white/5 backdrop-blur-sm border border-white/10 text-amber-100 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold shadow-lg tracking-wide uppercase">
                            {league}
                        </div>
                    )}
                    <h1 className="text-base sm:text-lg md:text-xl font-normal text-white tracking-wide">
                        {homeTeam.name} <span className="font-bold mx-1 sm:mx-3 text-white">VS</span> {awayTeam.name}
                    </h1>
                    {venue && (
                        <div className="mt-0.5 text-[10px] sm:text-xs text-gray-400 font-medium flex items-center justify-center gap-1.5 capitalize">
                            <span>🏟</span> {venue.toLowerCase().includes('unknown') ? '' : venue}
                        </div>
                    )}
                </div>

                {/* MIDDLE ROW: Logos & Score */}
                <div className="flex items-start justify-between w-full px-0 sm:px-2 md:px-6 lg:px-10">
                    
                    {/* HOME TEAM */}
                    <div className="flex flex-col items-center min-w-0">
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
                    <div className="flex flex-col items-center justify-start mt-0 min-w-[100px] sm:min-w-[140px]">
                        {/* Date & Time */}
                        <div className="text-[10px] sm:text-sm text-gray-300 font-semibold mb-4 sm:mb-6 tracking-wide whitespace-nowrap">
                            {formattedDate} <span className="ml-1">{kickoffTime}</span>
                        </div>

                        {/* Score Box */}
                        {isLoading ? (
                            <div className="flex flex-col items-center mt-2">
                                <div className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl px-4 sm:px-6 py-1 sm:py-2 shadow-lg flex items-center justify-center border border-white/10 animate-pulse">
                                    <span className="text-xl sm:text-3xl font-bold text-gray-500">-</span>
                                </div>
                            </div>
                        ) : score ? (
                            <div className="flex flex-col items-center">
                                {status !== "NS" && (
                                    <div className={`mb-1.5 text-[10px] sm:text-xs font-bold tracking-widest uppercase ${isLive ? "text-rose-500 animate-pulse" : "text-gray-400"}`}>
                                        {status === "HT" ? "HT" : isFinished ? "FT" : (isLive && displayDate ? displayDate : status)}
                                    </div>
                                )}
                                <div className={`bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl px-4 sm:px-6 py-1 sm:py-2 shadow-lg flex items-center justify-center gap-2 sm:gap-4 border border-white/10 ${isLive ? "animate-pulse" : ""}`}>
                                    <span className={`text-xl sm:text-3xl font-bold ${isLive ? "text-rose-500" : scoreColorClass}`}>{score.home}</span>
                                    <span className={`text-lg sm:text-xl font-bold ${isLive ? "text-gray-400" : dashColorClass}`}>-</span>
                                    <span className={`text-xl sm:text-3xl font-bold ${isLive ? "text-rose-500" : scoreColorClass}`}>{score.away}</span>
                                </div>
                                {score.halftime && score.halftime.home !== null && score.halftime.away !== null && (
                                    <div className="mt-1.5 text-[9px] sm:text-[10px] text-gray-500 font-semibold tracking-wide uppercase">
                                        HT: {score.halftime.home} - {score.halftime.away}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center mt-1">
                                {status && status !== "NS" && (
                                    <div className="mb-1.5 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-gray-400">
                                        {status}
                                    </div>
                                )}
                                <div className="bg-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-1 sm:py-2 flex items-center justify-center border border-white/5 backdrop-blur-md">
                                    <span className={`text-xl sm:text-3xl font-bold ${noScoreColorClass}`}>-</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* AWAY TEAM */}
                    <div className="flex flex-col items-center min-w-0">
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

