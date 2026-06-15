"use client";

import React, { useState } from "react";
import useSWR from "swr";
import H2HSection from "@/components/fixture-details/H2HSection";
import LastFiveMatches from "@/components/fixture-details/LastFiveMatches";
import Standings from "@/components/fixture-details/Standings";
import TeamDisplay from "@/components/fixture-details/TeamDisplay";
import Injuries from "@/components/fixture-details/Injuries";
import OverallStatistics from "@/components/fixture-details/OverallStatistics";
import OverUnderStatistics from "@/components/fixture-details/OverUnderStatistics";
import BTTSStatistics from "@/components/fixture-details/BTTSStatistics";
import MatchIntroduction from "@/components/fixture-details/MatchIntroduction";

type FixtureDetailsData = {
    fixtureId: number;
    leagueId: number;
    league: string;
    leagueLogo: string;
    country: string;
    date: string;
    displayDate: string;
    status: string;
    venue?: string;
    tip?: string;
    score?: { home: number | null; away: number | null } | null;
    injuries?: any[];
    h2h?: any[];
    standings?: any[];
    homeTeam: { id: number; name: string; logo: string; last5Matches?: any[]; allMatches?: any[] };
    awayTeam: { id: number; name: string; logo: string; last5Matches?: any[]; allMatches?: any[] };
};

interface FixtureDetailsClientProps {
    data: FixtureDetailsData;
}

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((res) => res.json());

const FixtureDetailsClient: React.FC<FixtureDetailsClientProps> = ({ data: initialData }) => {
    const [homeTab, setHomeTab] = useState<"all" | "home">("all");
    const [awayTab, setAwayTab] = useState<"all" | "away">("all");

    const isMatchLive = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"].includes(initialData.status) || initialData.status.includes("'");

    const { data: swrData } = useSWR(
        `${process.env.NEXT_PUBLIC_API_URL}/api/fixtures/${initialData.fixtureId}`,
        fetcher,
        {
            refreshInterval: isMatchLive ? 15000 : 0,
            revalidateOnMount: true,
            revalidateOnFocus: true,
        }
    );

    const data = swrData?.data ? { ...initialData, ...swrData.data } : initialData;

    const isFinishedCache = ["FT", "AET", "PEN"].includes(initialData.status);
    const hideStaleData = !isFinishedCache && !swrData;

    const displayInjuries = hideStaleData ? [] : data.injuries;

    const filteredH2H = data.h2h ? data.h2h.filter((m: any) => ["FT", "AET", "PEN", "AWD", "WO"].includes(m.fixture?.status?.short)) : [];
    const hasH2H = filteredH2H.length > 0;
    const homeMatches = data.homeTeam.allMatches || data.homeTeam.last5Matches || [];
    const awayMatches = data.awayTeam.allMatches || data.awayTeam.last5Matches || [];
    const hasAnyMatches = homeMatches.length > 0 || awayMatches.length > 0;

    const homeHomeMatches = homeMatches.filter((m: any) => m.homeTeam.name === data.homeTeam.name);
    const awayAwayMatches = awayMatches.filter((m: any) => m.awayTeam.name === data.awayTeam.name);
    const hasHomeHomeMatches = homeHomeMatches.length > 0;
    const hasAwayAwayMatches = awayAwayMatches.length > 0;
    const hasSplitMatches = hasHomeHomeMatches || hasAwayAwayMatches;

    // --- COMPUTE PREDICTION TIP ---
    const calculateStats = (matches: any[], limit: number) => {
        const recent = matches.slice(0, limit);
        let total = 0;
        let over25 = 0, under25 = 0;
        recent.forEach((m: any) => {
            const homeGoals = m.score?.home ?? m.goals?.home;
            const awayGoals = m.score?.away ?? m.goals?.away;
            if (homeGoals !== undefined && homeGoals !== null && awayGoals !== undefined && awayGoals !== null) {
                total++;
                const tg = homeGoals + awayGoals;
                if (tg > 2.5) over25++; else under25++;
            }
        });
        return { total, over25, under25 };
    };

    let computedTip = data.tip || "";
    if (computedTip === "NONE") {
        computedTip = "";
    }

    return (
        <div className="text-white pt-1 pb-4 px-2 sm:px-4">
            <div className="max-w-5xl mx-auto">
                {/* --- LEAGUE HEADER --- */}
                <div className="flex items-center gap-1 bg-gradient-to-r from-emerald-900/40 to-[#121212] py-0.5 px-1.5 sm:px-0.5 shadow-md border-y sm:border-x border-white/5 sm:border-b-0 mb-2 -mx-2 sm:mx-auto sm:rounded-t max-w-4xl">
                    <div className="flex items-center gap-1 w-full max-w-4xl mx-auto">
                        {data.leagueLogo && (
                            <img
                                src={data.leagueLogo}
                                alt={data.league}
                                className="w-4 h-4 flex-shrink-0 drop-shadow-md"
                            />
                        )}
                        <div className="flex flex-col truncate w-full leading-tight">
                            <span className="font-normal text-[10px] text-amber-100 tracking-wide truncate drop-shadow-sm">
                                {data.league}
                            </span>
                            <span className="text-[8px] text-emerald-200/70 font-normal capitalize tracking-wider truncate">
                                {data.country?.toLowerCase()}
                            </span>
                        </div>
                    </div>
                </div>

                <TeamDisplay
                    homeTeam={data.homeTeam}
                    awayTeam={data.awayTeam}
                    status={data.status}
                    displayDate={data.displayDate}
                    venue={data.venue}
                    date={data.date}
                    score={data.score}
                    league={data.league}
                    isLoading={hideStaleData}
                    tip={computedTip}
                />

                {/* --- MATCH INTRODUCTION --- */}
                <div className="mt-4 max-w-3xl mx-auto">
                    <MatchIntroduction
                        homeTeamName={data.homeTeam.name}
                        awayTeamName={data.awayTeam.name}
                        venue={data.venue}
                        homeMatches={data.homeTeam.allMatches}
                        awayMatches={data.awayTeam.allMatches}
                        h2hMatches={filteredH2H}
                        status={data.status}
                        score={data.score}
                        computedTip={computedTip}
                    />
                </div>

                {/* --- OVERVIEW SECTION --- */}
                <div className="mt-2">
                </div>

                {/* --- OVERALL STATISTICS SECTION --- */}
                {hasAnyMatches && (
                    <div className="mt-2">
                        <OverallStatistics homeTeam={data.homeTeam} awayTeam={data.awayTeam} />
                    </div>
                )}

                {/* --- OVER/UNDER STATISTICS SECTION --- */}
                {hasAnyMatches && (
                    <div className="mt-2">
                        <OverUnderStatistics homeTeam={data.homeTeam} awayTeam={data.awayTeam} />
                    </div>
                )}

                {/* --- BTTS STATISTICS SECTION --- */}
                {hasAnyMatches && (
                    <div className="mt-2">
                        <BTTSStatistics homeTeam={data.homeTeam} awayTeam={data.awayTeam} />
                    </div>
                )}

                {/* --- H2H SECTION --- */}
                {hasH2H && (
                    <div className="mt-2">
                        <div className="flex justify-center mb-3">
                            <h3 className="inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-1 bg-white/5 backdrop-blur-sm border border-white/10 text-amber-100 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-bold shadow-lg tracking-wide uppercase">
                                Head to Head
                            </h3>
                        </div>
                        <H2HSection h2h={filteredH2H} />
                    </div>
                )}

                {/* --- RECENT FORM SECTION --- */}
                {hasAnyMatches && (
                    <div className="mt-2 space-y-4">
                        <div className="flex justify-center mb-1">
                            <h3 className="inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-1 bg-white/5 backdrop-blur-sm border border-white/10 text-amber-100 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-bold shadow-lg tracking-wide uppercase">
                                Recent Form
                            </h3>
                        </div>

                        {/* Home Team Form */}
                        {homeMatches.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <div className="flex items-center gap-2">
                                        {data.homeTeam.logo && <img src={data.homeTeam.logo} alt={data.homeTeam.name} className="w-5 h-5 object-contain" />}
                                        <span className="text-[10px] sm:text-[11px] font-bold text-gray-200 uppercase truncate max-w-[150px]">{data.homeTeam.name}</span>
                                    </div>
                                    <div className="flex gap-1 bg-[#0F0F0F] p-0.5 rounded border border-white/10 shadow-sm">
                                        <button 
                                            onClick={() => setHomeTab("all")}
                                            className={`px-2 py-1 rounded text-[9px] font-bold transition-colors ${homeTab === "all" ? "bg-white/10 text-white" : "text-gray-400 hover:text-gray-200"}`}
                                        >
                                            Recent Form
                                        </button>
                                        <button 
                                            onClick={() => setHomeTab("home")}
                                            className={`px-2 py-1 rounded text-[9px] font-bold transition-colors ${homeTab === "home" ? "bg-white/10 text-white" : "text-gray-400 hover:text-gray-200"}`}
                                        >
                                            Home Form
                                        </button>
                                    </div>
                                </div>
                                <LastFiveMatches
                                    teamName={data.homeTeam.name}
                                    teamLogo={data.homeTeam.logo}
                                    matches={homeTab === "all" ? homeMatches : homeHomeMatches}
                                />
                            </div>
                        )}

                        {/* Away Team Form */}
                        {awayMatches.length > 0 && (
                            <div className="space-y-2 mt-4">
                                <div className="flex justify-between items-center px-1">
                                    <div className="flex items-center gap-2">
                                        {data.awayTeam.logo && <img src={data.awayTeam.logo} alt={data.awayTeam.name} className="w-5 h-5 object-contain" />}
                                        <span className="text-[10px] sm:text-[11px] font-bold text-gray-200 uppercase truncate max-w-[150px]">{data.awayTeam.name}</span>
                                    </div>
                                    <div className="flex gap-1 bg-[#0F0F0F] p-0.5 rounded border border-white/10 shadow-sm">
                                        <button 
                                            onClick={() => setAwayTab("all")}
                                            className={`px-2 py-1 rounded text-[9px] font-bold transition-colors ${awayTab === "all" ? "bg-white/10 text-white" : "text-gray-400 hover:text-gray-200"}`}
                                        >
                                            Recent Form
                                        </button>
                                        <button 
                                            onClick={() => setAwayTab("away")}
                                            className={`px-2 py-1 rounded text-[9px] font-bold transition-colors ${awayTab === "away" ? "bg-white/10 text-white" : "text-gray-400 hover:text-gray-200"}`}
                                        >
                                            Away Form
                                        </button>
                                    </div>
                                </div>
                                <LastFiveMatches
                                    teamName={data.awayTeam.name}
                                    teamLogo={data.awayTeam.logo}
                                    matches={awayTab === "all" ? awayMatches : awayAwayMatches}
                                />
                            </div>
                        )}
                    </div>
                )}



                {/* --- STANDINGS SECTION --- */}
                {data.standings && data.standings.length > 0 && (
                    <div className="mt-2">
                        <div className="flex justify-center mb-3">
                            <h3 className="inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-1 bg-white/5 backdrop-blur-sm border border-white/10 text-amber-100 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-bold shadow-lg tracking-wide uppercase">
                                League Table
                            </h3>
                        </div>
                        <div>
                            <Standings standings={data.standings || []} homeTeamId={data.homeTeam.id} awayTeamId={data.awayTeam.id} />
                        </div>
                    </div>
                )}

                {/* --- INJURIES SECTION --- */}
                {displayInjuries && displayInjuries.length > 0 && (
                    <div className="mt-2">
                        <div className="flex justify-center mb-3">
                            <h3 className="inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-1 bg-white/5 backdrop-blur-sm border border-white/10 text-amber-100 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-bold shadow-lg tracking-wide uppercase">
                                Injuries & Suspensions
                            </h3>
                        </div>
                        <div>
                            <Injuries injuries={displayInjuries} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FixtureDetailsClient;
