"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { AFFILIATE_PARTNERS, AffiliatePartner } from "@/lib/affiliatePartners";
import { resolveOdds } from "@/lib/oddsHelper";

interface Team {
    id?: number;
    name?: string;
    logo?: string;
    form?: { result: string; color: string }[];
    last5Matches?: any[];
}

interface TeamDisplayProps {
    homeTeam?: Team;
    awayTeam?: Team;
    status?: string;
    displayDate?: string;
    venue?: string;
    date?: string;
    score?: { home: number | null; away: number | null; halftime?: { home: number | null; away: number | null } } | null;
    league?: string;
    isLoading?: boolean;
    tip?: string;
    fixtureId?: number;
    odds?: any;
}

const TeamDisplay: React.FC<TeamDisplayProps> = ({
    homeTeam,
    awayTeam,
    status = "NS",
    displayDate = "",
    date = "",
    venue,
    score,
    league,
    isLoading,
    tip,
    fixtureId,
    odds,
}) => {
    let oddsObj = { home: "2.10", draw: "3.25", away: "3.30" };
    try {
        oddsObj = resolveOdds(fixtureId || 1, odds, tip);
    } catch (e) {
        // fallback defaults
    }

    const [partner, setPartner] = useState<AffiliatePartner>(AFFILIATE_PARTNERS[0] || {
        id: "1xbet",
        name: "1XBET",
        ctaText: "300% Bonus",
        url: "https://reffpa.com/L?tag=d_5148910m_97c_telegram&site=5148910&ad=97&r=registration",
        bgColor: "#1a56db",
        textColor: "#ffffff",
    });

    useEffect(() => {
        if (AFFILIATE_PARTNERS && AFFILIATE_PARTNERS.length > 1) {
            const randomIndex = Math.floor(Math.random() * AFFILIATE_PARTNERS.length);
            if (AFFILIATE_PARTNERS[randomIndex]) {
                setPartner(AFFILIATE_PARTNERS[randomIndex]);
            }
        }
    }, []);

    const isLive = Boolean(status && ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(status));
    const isFinished = Boolean(status && ["FT", "AET", "PEN"].includes(status));
    
    let kickoffTime = displayDate || "TBD";
    let formattedDate = "";
    try {
        if (date) {
            const dateObj = new Date(date);
            if (!isNaN(dateObj.getTime())) {
                kickoffTime = dateObj.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                    timeZone: "Africa/Nairobi",
                });
                formattedDate = dateObj.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    timeZone: "Africa/Nairobi",
                });
            }
        }
    } catch {
        // Safe fallback
    }

    let scoreColorClass = "text-gray-900";
    let dashColorClass = "text-gray-600";
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
            } else if (tip === "BTTS" || tip.includes("GG")) {
                isWon = score.home > 0 && score.away > 0;
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
            } else if (tip === "1" || tip === "HOME WIN") {
                isWon = score.home > score.away;
                isValidTip = true;
            } else if (tip === "2" || tip === "AWAY WIN") {
                isWon = score.away > score.home;
                isValidTip = true;
            }
            
            if (isValidTip) {
                scoreColorClass = isWon ? "text-[#22c55e]" : "text-[#ef4444]";
                dashColorClass = scoreColorClass;
            }
        }
    }

    const getFormattedTip = (rawTip?: string) => {
        if (!rawTip || rawTip === "NONE") return null;
        if (rawTip === "OV1.5" || rawTip === "Over 1.5") return "Over 1.5 Goals";
        if (rawTip === "UN3.5" || rawTip === "Under 3.5") return "Under 3.5 Goals";
        if (rawTip === "OV2.5" || rawTip === "Over 2.5") return "Over 2.5 Goals";
        if (rawTip === "UN2.5" || rawTip === "Under 2.5") return "Under 2.5 Goals";
        if (rawTip === "BTTS" || rawTip === "GG") return "Both Teams to Score";
        if (rawTip === "1" || rawTip === "HOME WIN") return "Home Win";
        if (rawTip === "2" || rawTip === "AWAY WIN") return "Away Win";
        return rawTip;
    };

    const formattedTipText = getFormattedTip(tip);

    let tipBadgeColor = "bg-teal-50 text-teal-800 border-teal-300";
    if (tip) {
        if (isFinished && score && score.home !== null && score.away !== null) {
            const totalGoals = score.home + score.away;
            let isWon = false;
            let isValid = false;

            if (tip.includes("Over 1.5") || tip.includes("OV1.5")) {
                isWon = totalGoals > 1.5;
                isValid = true;
            } else if (tip === "BTTS" || tip.includes("GG")) {
                isWon = score.home > 0 && score.away > 0;
                isValid = true;
            } else if (tip.includes("Over 2.5") || tip.includes("OV2.5")) {
                isWon = totalGoals > 2.5;
                isValid = true;
            } else if (tip.includes("Under 2.5") || tip.includes("UN2.5")) {
                isWon = totalGoals < 2.5;
                isValid = true;
            } else if (tip.includes("Under 3.5") || tip.includes("UN3.5")) {
                isWon = totalGoals < 3.5;
                isValid = true;
            } else if (tip === "1" || tip === "HOME WIN") {
                isWon = score.home > score.away;
                isValid = true;
            } else if (tip === "2" || tip === "AWAY WIN") {
                isWon = score.away > score.home;
                isValid = true;
            }

            if (isValid) {
                tipBadgeColor = isWon 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : "bg-rose-50 text-rose-700 border-rose-300";
            }
        } else if (isLive) {
            tipBadgeColor = "bg-amber-50 text-amber-800 border-amber-300 animate-pulse";
        }
    }

    // Form bubble renderer
    const renderForm = (last5Matches?: any[]) => {
        if (!last5Matches || !Array.isArray(last5Matches) || last5Matches.length === 0) return null;
        return (
            <div className="flex flex-wrap justify-center gap-[2px] sm:gap-1 mb-1.5 px-0">
                {last5Matches.map((m, i) => {
                    const res = m?.result || "D";
                    let bgClass = "bg-[#eab308]"; // Yellow for Draw
                    if (res === "W") bgClass = "bg-[#16a34a]"; // Green for Win
                    if (res === "L") bgClass = "bg-[#dc2626]"; // Red for Loss

                    return (
                        <div key={i} className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 rounded-full text-[6px] sm:text-[7px] font-bold flex items-center justify-center text-gray-900 ${bgClass} shadow-sm`}>
                            {res}
                        </div>
                    );
                })}
            </div>
        );
    };

    const homeName = homeTeam?.name || "Home";
    const awayName = awayTeam?.name || "Away";

    return (
        <div className="relative w-full pb-1 sm:pb-2 flex flex-col items-center bg-transparent">

            <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
                

                {/* MIDDLE ROW: Logos & Score */}
                <div className="flex items-start justify-between w-full px-0 sm:px-2 md:px-6 lg:px-10">
                    
                    {/* HOME TEAM */}
                    <div className="flex flex-col items-center min-w-0">
                        {/* Form */}
                        {renderForm(homeTeam?.last5Matches)}
                        {/* Logo Card */}
                        <div className="mx-2 w-14 h-16 sm:w-16 sm:h-20 md:w-20 md:h-24 bg-gray-100 rounded-2xl sm:rounded-[2rem] border border-gray-300 flex items-center justify-center p-1 shadow-lg backdrop-blur-sm">
                            <div className="relative w-full h-full filter drop-shadow-md">
                                {homeTeam?.logo ? (
                                    <Image src={homeTeam.logo} alt={homeName} fill className="object-contain" unoptimized />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                                        {homeName.slice(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </div>
                        <span className="mt-1.5 text-[11px] sm:text-[12px] font-bold text-gray-900 capitalize text-center leading-tight break-words max-w-[100px] sm:max-w-[120px] tracking-wider px-1">
                            {homeName}
                        </span>
                    </div>

                    {/* CENTER INFO */}
                    <div className="flex flex-col items-center justify-start mt-0 min-w-[100px] sm:min-w-[140px]">
                        {/* Date & Time */}
                        <div className="text-[11px] sm:text-[12px] text-gray-700 font-semibold mb-2 sm:mb-4 tracking-wide whitespace-nowrap">
                            {formattedDate} <span className="ml-1">{kickoffTime}</span>
                        </div>

                        {/* Score Box */}
                        {isLoading ? (
                            <div className="flex flex-col items-center mt-2">
                                <div className="bg-gray-100 backdrop-blur-sm rounded-xl px-4 sm:px-6 py-1 sm:py-2 shadow-lg flex items-center justify-center border border-gray-300 animate-pulse">
                                    <span className="text-base sm:text-lg font-bold text-gray-500">-</span>
                                </div>
                            </div>
                        ) : score ? (
                            <div className="flex flex-col items-center">
                                {status !== "NS" && (
                                    <div className={`mb-1.5 text-[10px] sm:text-[11px] font-bold tracking-widest uppercase ${isLive ? "text-rose-500 animate-pulse" : "text-gray-600"}`}>
                                        {status === "HT" ? "HT" : isFinished ? "FT" : (isLive && displayDate ? displayDate : status)}
                                    </div>
                                )}
                                <div className={`bg-gray-100 backdrop-blur-sm rounded-xl px-4 py-1 shadow-lg flex items-center justify-center gap-2 sm:gap-3 border border-gray-300 ${isLive ? "animate-pulse" : ""}`}>
                                    <span className={`text-base sm:text-lg md:text-xl font-bold ${isLive ? "text-rose-500" : scoreColorClass}`}>{score.home}</span>
                                    <span className={`text-sm sm:text-base font-bold ${isLive ? "text-gray-600" : dashColorClass}`}>-</span>
                                    <span className={`text-base sm:text-lg md:text-xl font-bold ${isLive ? "text-rose-500" : scoreColorClass}`}>{score.away}</span>
                                </div>
                                {score.halftime && score.halftime.home !== null && score.halftime.away !== null && (
                                    <div className="mt-1.5 text-[10px] sm:text-[11px] text-gray-500 font-semibold tracking-wide uppercase">
                                        HT: {score.halftime.home} - {score.halftime.away}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center mt-1">
                                {status && status !== "NS" && (
                                    <div className="mb-1.5 text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-gray-600">
                                        {status}
                                    </div>
                                )}
                                <div className="bg-gray-200 rounded-xl px-4 py-1 flex items-center justify-center border border-gray-200 backdrop-blur-md">
                                    <span className={`text-base sm:text-lg md:text-xl font-bold ${noScoreColorClass}`}>-</span>
                                </div>
                            </div>
                        )}

                        {/* PREDICTION AREA BELOW SCORE */}
                        <div className="mt-2.5 flex flex-col items-center gap-1.5 w-full">
                            {/* Prediction Badge */}
                            {formattedTipText && (
                                <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] sm:text-[11px] font-bold shadow-xs whitespace-nowrap ${tipBadgeColor}`}>
                                    <span className="text-[9px] uppercase tracking-wider font-semibold opacity-75">Tip:</span>
                                    <span>{formattedTipText}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* AWAY TEAM */}
                    <div className="flex flex-col items-center min-w-0">
                        {/* Form */}
                        {renderForm(awayTeam?.last5Matches)}
                        {/* Logo Card */}
                        <div className="mx-2 w-14 h-16 sm:w-16 sm:h-20 md:w-20 md:h-24 bg-gray-100 rounded-2xl sm:rounded-[2rem] border border-gray-300 flex items-center justify-center p-1 shadow-lg backdrop-blur-sm">
                            <div className="relative w-full h-full filter drop-shadow-md">
                                {awayTeam?.logo ? (
                                    <Image src={awayTeam.logo} alt={awayName} fill className="object-contain" unoptimized />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                                        {awayName.slice(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </div>
                        <span className="mt-1.5 text-[11px] sm:text-[12px] font-bold text-gray-900 capitalize text-center leading-tight break-words max-w-[100px] sm:max-w-[120px] tracking-wider px-1">
                            {awayName}
                        </span>
                    </div>
                </div>

                {/* 1 X 2 ODDS ROW (Just below team names row with affiliate link in top right) */}
                <div className="w-full flex items-center justify-between mt-3 px-2 sm:px-6 pt-2 border-t border-gray-200 gap-2">
                    {/* LEFT: 1 X 2 ODDS PILLS */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider mr-0.5">1X2:</span>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 border border-gray-300 text-gray-800 text-[10px] sm:text-[11px]">
                            <span className="font-semibold text-gray-400">1</span>
                            <span className="font-bold text-gray-900">{oddsObj.home}</span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 border border-gray-300 text-gray-800 text-[10px] sm:text-[11px]">
                            <span className="font-semibold text-gray-400">X</span>
                            <span className="font-bold text-gray-900">{oddsObj.draw}</span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 border border-gray-300 text-gray-800 text-[10px] sm:text-[11px]">
                            <span className="font-semibold text-gray-400">2</span>
                            <span className="font-bold text-gray-900">{oddsObj.away}</span>
                        </div>
                    </div>

                    {/* TOP RIGHT CORNER: BETTING SITES AFFILIATE LINK */}
                    <div className="flex items-center justify-end">
                        <a
                            href={partner.url}
                            target="_blank"
                            rel="noopener noreferrer sponsored"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] sm:text-[11px] font-bold shadow-2xs hover:opacity-90 transition-transform active:scale-95 cursor-pointer"
                            style={{ backgroundColor: partner.bgColor, color: partner.textColor }}
                            title={`Bet on ${partner.name} - ${partner.ctaText}`}
                        >
                            <span>{partner.name}</span>
                            <span className="hidden sm:inline font-normal opacity-90 text-[9px]">• {partner.ctaText}</span>
                            <ExternalLink size={10} className="shrink-0" />
                        </a>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TeamDisplay;
