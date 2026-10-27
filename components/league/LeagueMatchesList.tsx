import React, { useState } from "react";
import Link from "next/link";
import { Calendar, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { resolveOdds, getAffiliatePartner } from "@/lib/oddsHelper";

export interface LeagueMatchItem {
    fixtureId: number;
    date: string;
    status: string;
    elapsed?: number | null;
    round?: string | null;
    venue?: string | null;
    homeTeam: {
        id: number;
        name: string;
        logo?: string;
    };
    awayTeam: {
        id: number;
        name: string;
        logo?: string;
    };
    score?: string | null;
    predictionTip?: string | null;
    customPrediction?: string | null;
}

interface LeagueMatchesListProps {
    upcoming: LeagueMatchItem[];
    results: LeagueMatchItem[];
}

const LeagueMatchesList: React.FC<LeagueMatchesListProps> = ({ upcoming, results }) => {
    const [subTab, setSubTab] = useState<"upcoming" | "results">(() => {
        if (upcoming && upcoming.length > 0) return "upcoming";
        return "results";
    });

    const activeList = subTab === "upcoming" ? upcoming : results;

    const formatMatchDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Africa/Nairobi",
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="space-y-3 w-full animate-in fade-in duration-300">
            {/* Sub-tab pills: Upcoming vs Results */}
            <div className="flex items-center justify-center gap-2 p-1 bg-gray-100 rounded-lg max-w-xs mx-auto border border-gray-200">
                <button
                    onClick={() => setSubTab("upcoming")}
                    className={`flex-1 py-1 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        subTab === "upcoming"
                            ? "bg-white text-teal-700 shadow-xs"
                            : "text-gray-500 hover:text-gray-800"
                    }`}
                >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Upcoming ({upcoming.length})</span>
                </button>
                <button
                    onClick={() => setSubTab("results")}
                    className={`flex-1 py-1 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        subTab === "results"
                            ? "bg-white text-teal-700 shadow-xs"
                            : "text-gray-500 hover:text-gray-800"
                    }`}
                >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Results ({results.length})</span>
                </button>
            </div>

            {/* Match Cards */}
            {activeList.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center shadow-xs">
                    <div className="w-12 h-12 mx-auto rounded-full bg-teal-50 flex items-center justify-center mb-3">
                        <Calendar className="w-6 h-6 text-teal-600" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-800 mb-1">
                        No {subTab === "upcoming" ? "upcoming fixtures" : "recent results"} available
                    </h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                        Check back soon as fixtures and results are refreshed daily.
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-gray-100 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
                    {activeList.map((match) => {
                        const isFinished = ["FT", "AET", "PEN"].includes(match.status);
                        const isLive = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"].includes(match.status);
                        const tip = match.customPrediction || match.predictionTip;
                        const oddsObj = resolveOdds(match.fixtureId, (match as any).odds, tip);
                        const partner = getAffiliatePartner(match.fixtureId);

                        return (
                            <Link
                                key={match.fixtureId}
                                href={`/prediction/${match.fixtureId}`}
                                className="block p-2.5 sm:p-3 hover:bg-teal-50/40 transition-colors group"
                            >
                                <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1.5">
                                    <span className="font-medium text-gray-500">
                                        {formatMatchDate(match.date)}
                                    </span>
                                    {match.round && (
                                        <span className="text-gray-400 truncate max-w-[150px]">
                                            {match.round}
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                                    {/* Home Team */}
                                    <div className="flex items-center justify-end gap-2 text-right">
                                        <span className="font-semibold text-xs sm:text-sm text-gray-800 truncate group-hover:text-teal-700 transition-colors">
                                            {match.homeTeam.name}
                                        </span>
                                        {match.homeTeam.logo && (
                                            <img
                                                src={match.homeTeam.logo}
                                                alt={match.homeTeam.name}
                                                className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0"
                                                loading="lazy"
                                            />
                                        )}
                                    </div>

                                    {/* Score / Status Pill */}
                                    <div className="flex flex-col items-center justify-center min-w-[70px] sm:min-w-[85px] px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200">
                                        {isFinished ? (
                                            <span className="font-bold text-xs sm:text-sm text-gray-900 tracking-wider">
                                                {match.score || "FT"}
                                            </span>
                                        ) : isLive ? (
                                            <div className="flex flex-col items-center">
                                                <span className="font-bold text-xs sm:text-sm text-rose-600 animate-pulse">
                                                    {match.score || "LIVE"}
                                                </span>
                                                <span className="text-[9px] font-bold text-rose-500">
                                                    {match.elapsed ? `${match.elapsed}'` : "LIVE"}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-[11px] font-bold text-gray-600">
                                                {match.status === "NS"
                                                    ? new Date(match.date).toLocaleTimeString("en-GB", {
                                                          hour: "2-digit",
                                                          minute: "2-digit",
                                                          timeZone: "Africa/Nairobi",
                                                      })
                                                    : match.status}
                                            </span>
                                        )}
                                    </div>

                                    {/* Away Team */}
                                    <div className="flex items-center justify-start gap-2 text-left">
                                        {match.awayTeam.logo && (
                                            <img
                                                src={match.awayTeam.logo}
                                                alt={match.awayTeam.name}
                                                className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0"
                                                loading="lazy"
                                            />
                                        )}
                                        <span className="font-semibold text-xs sm:text-sm text-gray-800 truncate group-hover:text-teal-700 transition-colors">
                                            {match.awayTeam.name}
                                        </span>
                                    </div>
                                </div>

                                {/* 1 X 2 ODDS ROW (Just below team names row) */}
                                <div className="w-full flex items-center justify-between mt-2 pt-1.5 border-t border-gray-100 gap-1">
                                    {/* LEFT: 1 X 2 ODDS PILLS */}
                                    <div className="flex items-center gap-1 sm:gap-1.5">
                                        {/* 1 */}
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50 border border-gray-200 text-gray-700 text-[9px] sm:text-[10px]">
                                            <span className="font-semibold text-gray-400">1</span>
                                            <span className="font-bold text-gray-900">{oddsObj.home}</span>
                                        </div>

                                        {/* X */}
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50 border border-gray-200 text-gray-700 text-[9px] sm:text-[10px]">
                                            <span className="font-semibold text-gray-400">X</span>
                                            <span className="font-bold text-gray-900">{oddsObj.draw}</span>
                                        </div>

                                        {/* 2 */}
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50 border border-gray-200 text-gray-700 text-[9px] sm:text-[10px]">
                                            <span className="font-semibold text-gray-400">2</span>
                                            <span className="font-bold text-gray-900">{oddsObj.away}</span>
                                        </div>
                                    </div>

                                    {/* TOP RIGHT CORNER: BETTING SITES AFFILIATE LINK */}
                                    <div className="flex items-center justify-end">
                                        <span
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                window.open(partner.url, "_blank", "noopener,noreferrer,sponsored");
                                            }}
                                            role="button"
                                            tabIndex={0}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold shadow-2xs hover:opacity-90 transition-transform active:scale-95 cursor-pointer"
                                            style={{ backgroundColor: partner.bgColor, color: partner.textColor }}
                                            title={`Bet on ${partner.name} - ${partner.ctaText}`}
                                        >
                                            <span>{partner.name}</span>
                                            <span className="hidden sm:inline font-normal opacity-90 text-[8px]">• {partner.ctaText}</span>
                                            <ExternalLink size={9} className="shrink-0" />
                                        </span>
                                    </div>
                                </div>

                                {/* Prediction Tip Footer Pill */}
                                {tip && (
                                    <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between text-[10px]">
                                        <span className="text-gray-400 font-medium">Prediction Tip:</span>
                                        <span className="font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                                            {tip}
                                        </span>
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default LeagueMatchesList;

