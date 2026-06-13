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
            <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5 mb-2 px-1">
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
        <div className="relative w-full pb-1 sm:pb-2 flex flex-col items-center bg-transparent">

            <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
                

                {/* MIDDLE ROW: Logos & Score */}
                <div className="flex items-start justify-between w-full px-0 sm:px-2 md:px-6 lg:px-10">
                    
                    {/* HOME TEAM */}
                    <div className="flex flex-col items-start min-w-0">
                        {/* Form */}
                        {renderForm(homeTeam.last5Matches)}
                        {/* Logo Card */}
                        <div className="w-14 h-16 sm:w-16 sm:h-20 md:w-20 md:h-24 bg-white/5 rounded-2xl sm:rounded-[2rem] border border-white/10 flex items-center justify-center p-1 shadow-lg backdrop-blur-sm">
                            <div className="relative w-full h-full filter drop-shadow-md">
                                <Image src={homeTeam?.logo} alt={homeTeam?.name} fill className="object-contain" unoptimized />
                            </div>
                        </div>
                        <span className="mt-1.5 text-[8px] font-bold text-white capitalize text-left leading-tight break-words max-w-[100px] sm:max-w-[120px] tracking-wider px-1">{homeTeam.name}</span>
                    </div>

                    {/* CENTER INFO */}
                    <div className="flex flex-col items-center justify-start mt-0 min-w-[100px] sm:min-w-[140px]">
                        {/* Date & Time */}
                        <div className="text-[9px] sm:text-[10px] text-gray-300 font-semibold mb-2 sm:mb-4 tracking-wide whitespace-nowrap">
                            {formattedDate} <span className="ml-1">{kickoffTime}</span>
                        </div>

                        {/* Score Box */}
                        {isLoading ? (
                            <div className="flex flex-col items-center mt-2">
                                <div className="bg-white/5 backdrop-blur-sm rounded-xl px-4 sm:px-6 py-1 sm:py-2 shadow-lg flex items-center justify-center border border-white/10 animate-pulse">
                                    <span className="text-base sm:text-lg font-bold text-gray-500">-</span>
                                </div>
                            </div>
                        ) : score ? (
                            <div className="flex flex-col items-center">
                                {status !== "NS" && (
                                    <div className={`mb-1.5 text-[9px] sm:text-[10px] font-bold tracking-widest uppercase ${isLive ? "text-rose-500 animate-pulse" : "text-gray-400"}`}>
                                        {status === "HT" ? "HT" : isFinished ? "FT" : (isLive && displayDate ? displayDate : status)}
                                    </div>
                                )}
                                <div className={`bg-white/5 backdrop-blur-sm rounded-xl px-4 py-1 shadow-lg flex items-center justify-center gap-2 sm:gap-3 border border-white/10 ${isLive ? "animate-pulse" : ""}`}>
                                    <span className={`text-base sm:text-lg md:text-xl font-bold ${isLive ? "text-rose-500" : scoreColorClass}`}>{score.home}</span>
                                    <span className={`text-sm sm:text-base font-bold ${isLive ? "text-gray-400" : dashColorClass}`}>-</span>
                                    <span className={`text-base sm:text-lg md:text-xl font-bold ${isLive ? "text-rose-500" : scoreColorClass}`}>{score.away}</span>
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
                                    <div className="mb-1.5 text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-gray-400">
                                        {status}
                                    </div>
                                )}
                                <div className="bg-white/10 rounded-xl px-4 py-1 flex items-center justify-center border border-white/5 backdrop-blur-md">
                                    <span className={`text-base sm:text-lg md:text-xl font-bold ${noScoreColorClass}`}>-</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* AWAY TEAM */}
                    <div className="flex flex-col items-end min-w-0">
                        {/* Form */}
                        {renderForm(awayTeam.last5Matches)}
                        {/* Logo Card */}
                        <div className="w-14 h-16 sm:w-16 sm:h-20 md:w-20 md:h-24 bg-white/5 rounded-2xl sm:rounded-[2rem] border border-white/10 flex items-center justify-center p-1 shadow-lg backdrop-blur-sm">
                            <div className="relative w-full h-full filter drop-shadow-md">
                                <Image src={awayTeam?.logo} alt={awayTeam?.name} fill className="object-contain" unoptimized />
                            </div>
                        </div>
                        <span className="mt-1.5 text-[8px] font-bold text-white capitalize text-right leading-tight break-words max-w-[100px] sm:max-w-[120px] tracking-wider px-1">{awayTeam.name}</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TeamDisplay;

