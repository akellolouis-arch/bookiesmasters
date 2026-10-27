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
import MatchEvents from "@/components/fixture-details/MatchEvents";
import Statistics from "@/components/fixture-details/Statistics";
import Lineups from "@/components/fixture-details/Lineups";
import Footer from "@/components/Footer";
import { Activity, BarChart2, Users, FileText, Trophy, ChevronRight } from "lucide-react";

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
    events?: any[];
    statistics?: any[];
    lineups?: any[];
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
    const isMatchLive = Boolean(
        initialData?.status && (
            ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"].includes(initialData.status) ||
            initialData.status.includes("'")
        )
    );

    const [activeTab, setActiveTab] = useState<"overview" | "events" | "stats" | "lineups" | "table">(() => {
        if (isMatchLive) return "events";
        if (initialData?.events && initialData.events.length > 0) return "overview";
        return "overview";
    });

    const [homeTab, setHomeTab] = useState<"all" | "home">("all");
    const [awayTab, setAwayTab] = useState<"all" | "away">("all");

    const { data: swrData } = useSWR(
        isMatchLive && initialData?.fixtureId ? `${process.env.NEXT_PUBLIC_API_URL}/api/fixtures/${initialData.fixtureId}` : null,
        fetcher,
        {
            refreshInterval: isMatchLive ? 30000 : 0,
            revalidateOnMount: false,
            revalidateOnFocus: false,
        }
    );

    const data = swrData?.data ? { ...initialData, ...swrData.data } : initialData;

    const displayInjuries = Array.isArray(data?.injuries) ? data.injuries : [];
    const isLoading = isMatchLive && !swrData;

    const filteredH2H = Array.isArray(data?.h2h)
        ? data.h2h.filter((m: any) => ["FT", "AET", "PEN", "AWD", "WO"].includes(m?.fixture?.status?.short))
        : [];
    const hasH2H = filteredH2H.length > 0;
    const homeMatches = data?.homeTeam?.allMatches || data?.homeTeam?.last5Matches || [];
    const awayMatches = data?.awayTeam?.allMatches || data?.awayTeam?.last5Matches || [];
    const hasAnyMatches = homeMatches.length > 0 || awayMatches.length > 0;

    const homeHomeMatches = homeMatches.filter((m: any) => m?.homeTeam?.name === data?.homeTeam?.name);
    const awayAwayMatches = awayMatches.filter((m: any) => m?.awayTeam?.name === data?.awayTeam?.name);

    let computedTip = data?.tip || "";
    if (computedTip === "NONE") {
        computedTip = "";
    }

    const eventsList = Array.isArray(data?.events) ? data.events : [];
    const statsList = Array.isArray(data?.statistics) ? data.statistics : [];
    const lineupsList = Array.isArray(data?.lineups) ? data.lineups : [];

    const hasEvents = eventsList.length > 0;
    const hasStats = statsList.length > 0;
    const hasLineups = lineupsList.length > 0;

    return (
        <div className="text-gray-900 pt-0 pb-4 px-2 sm:px-4">
            <div className="max-w-5xl mx-auto">
                {/* --- LEAGUE HEADER --- */}
                <Link
                    href={data.leagueId ? `/league/${data.leagueId}` : "#"}
                    className="flex items-center justify-between gap-1 bg-gray-100 hover:bg-gray-200/80 py-1 px-1.5 shadow-xs border border-gray-200 border-b-0 max-w-4xl mx-auto mb-2 transition-colors group cursor-pointer"
                    title={`View ${data.league} standings, fixtures & top scorers`}
                >
                    <div className="flex items-center gap-1.5 w-full max-w-4xl min-w-0">
                        {data.leagueLogo && (
                            <img
                                src={data.leagueLogo}
                                alt={data.league}
                                className="w-4 h-4 flex-shrink-0 drop-shadow-xs"
                            />
                        )}
                        <div className="flex flex-col truncate w-full leading-tight">
                            <span className="font-bold text-[11px] text-teal-800 tracking-wide truncate group-hover:text-teal-900 transition-colors">
                                {data.league}
                            </span>
                            <span className="text-[9px] text-gray-500 font-normal capitalize tracking-wider truncate">
                                {data.country?.toLowerCase()}
                            </span>
                        </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-teal-700 transition-colors flex-shrink-0 mr-0.5" />
                </Link>

                {/* --- TEAM DISPLAY & SCORE --- */}
                <TeamDisplay
                    homeTeam={data.homeTeam}
                    awayTeam={data.awayTeam}
                    status={data.status}
                    displayDate={data.displayDate}
                    venue={data.venue}
                    date={data.date}
                    score={data.score}
                    league={data.league}
                    isLoading={isLoading}
                    tip={computedTip}
                    fixtureId={data.fixtureId}
                />

                {/* --- SOFASCORE-STYLE NAVIGATION TABS --- */}
                <div className="max-w-3xl mx-auto mt-3 mb-2">
                    <div className="flex items-center justify-center p-1 bg-gray-100 rounded-xl border border-gray-200 shadow-xs gap-1">
                        {/* 1. OVERVIEW & TIPS */}
                        <button
                            onClick={() => setActiveTab("overview")}
                            className={`flex items-center justify-center gap-1 sm:gap-1.5 flex-1 py-1.5 px-1 sm:px-2 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all ${
                                activeTab === "overview"
                                    ? "bg-white text-teal-700 shadow-xs"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Overview</span>
                        </button>

                        {/* 2. MATCH EVENTS (GOALS & CARDS) */}
                        <button
                            onClick={() => setActiveTab("events")}
                            className={`flex items-center justify-center gap-1 sm:gap-1.5 flex-1 py-1.5 px-1 sm:px-2 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all relative ${
                                activeTab === "events"
                                    ? "bg-white text-teal-700 shadow-xs"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            <Activity className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Events</span>
                            {isMatchLive ? (
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse inline-block" />
                            ) : hasEvents ? (
                                <span className="text-[9px] px-1 py-0.2 bg-emerald-50 text-emerald-700 rounded-full font-bold">
                                    {eventsList.length}
                                </span>
                            ) : null}
                        </button>

                        {/* 3. MATCH STATS */}
                        <button
                            onClick={() => setActiveTab("stats")}
                            className={`flex items-center justify-center gap-1 sm:gap-1.5 flex-1 py-1.5 px-1 sm:px-2 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all ${
                                activeTab === "stats"
                                    ? "bg-white text-teal-700 shadow-xs"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            <BarChart2 className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Stats</span>
                        </button>

                        {/* 4. LINEUPS */}
                        <button
                            onClick={() => setActiveTab("lineups")}
                            className={`flex items-center justify-center gap-1 sm:gap-1.5 flex-1 py-1.5 px-1 sm:px-2 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all ${
                                activeTab === "lineups"
                                    ? "bg-white text-teal-700 shadow-xs"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            <Users className="w-3.5 h-3.5 text-blue-500" />
                            <span>Lineups</span>
                        </button>

                        {/* 5. TABLE / STANDINGS */}
                        <button
                            onClick={() => setActiveTab("table")}
                            className={`flex items-center justify-center gap-1 sm:gap-1.5 flex-1 py-1.5 px-1 sm:px-2 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all ${
                                activeTab === "table"
                                    ? "bg-white text-teal-700 shadow-xs"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            <Trophy className="w-3.5 h-3.5 text-amber-500" />
                            <span>Table</span>
                        </button>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* TAB CONTENT 1: MATCH EVENTS                                                */}
                {/* ========================================================================= */}
                {activeTab === "events" && (
                    <div className="animate-in fade-in duration-300">
                        <MatchEvents
                            events={eventsList}
                            homeTeamId={data?.homeTeam?.id || 0}
                            awayTeamId={data?.awayTeam?.id || 0}
                            homeTeamName={data?.homeTeam?.name || "Home"}
                            awayTeamName={data?.awayTeam?.name || "Away"}
                            status={data?.status}
                        />
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TAB CONTENT 2: MATCH STATISTICS                                           */}
                {/* ========================================================================= */}
                {activeTab === "stats" && (
                    <div className="animate-in fade-in duration-300">
                        <Statistics stats={statsList} />
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TAB CONTENT 3: LINEUPS                                                     */}
                {/* ========================================================================= */}
                {activeTab === "lineups" && (
                    <div className="bg-white rounded-xl shadow-xs p-3 border border-gray-200 max-w-3xl mx-auto my-3 animate-in fade-in duration-300">
                        <Lineups lineups={lineupsList} injuries={displayInjuries} />
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TAB CONTENT 4: LEAGUE TABLE / STANDINGS                                   */}
                {/* ========================================================================= */}
                {activeTab === "table" && (
                    <div className="bg-white rounded-xl shadow-xs p-3 sm:p-4 border border-gray-200 max-w-3xl mx-auto my-3 animate-in fade-in duration-300">
                        {data?.standings && data.standings.length > 0 ? (
                            <Standings
                                standings={data.standings || []}
                                homeTeamId={data?.homeTeam?.id || 0}
                                awayTeamId={data?.awayTeam?.id || 0}
                                defaultShowAll={true}
                            />
                        ) : (
                            <div className="text-center py-12 px-4">
                                <div className="w-12 h-12 mx-auto rounded-full bg-teal-50 flex items-center justify-center mb-3">
                                    <Trophy className="w-6 h-6 text-teal-600" />
                                </div>
                                <h4 className="text-sm font-bold text-gray-800 mb-1">
                                    Standings Unavailable
                                </h4>
                                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                                    League standings are not applicable or currently unavailable for this cup, qualification round, or tournament.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TAB CONTENT 5: OVERVIEW & PREDICTIONS                                     */}
                {/* ========================================================================= */}
                {activeTab === "overview" && (
                    <div className="animate-in fade-in duration-300 space-y-4">
                        {/* If match is Live or Finished and has events, show quick events preview */}
                        {hasEvents && (
                            <div className="mt-2">
                                <MatchEvents
                                    events={eventsList}
                                    homeTeamId={data?.homeTeam?.id || 0}
                                    awayTeamId={data?.awayTeam?.id || 0}
                                    homeTeamName={data?.homeTeam?.name || "Home"}
                                    awayTeamName={data?.awayTeam?.name || "Away"}
                                    status={data?.status}
                                />
                            </div>
                        )}

                        {/* --- MATCH INTRODUCTION & STORY --- */}
                        <div className="max-w-3xl mx-auto">
                            <MatchIntroduction
                                homeTeamName={data?.homeTeam?.name || "Home"}
                                awayTeamName={data?.awayTeam?.name || "Away"}
                                venue={data?.venue}
                                homeMatches={data?.homeTeam?.allMatches}
                                awayMatches={data?.awayTeam?.allMatches}
                                h2hMatches={filteredH2H}
                                status={data?.status}
                                score={data?.score}
                                computedTip={computedTip}
                            />
                        </div>

                        {/* --- OVERALL STATISTICS SECTION --- */}
                        {hasAnyMatches && data?.homeTeam && data?.awayTeam && (
                            <div className="mt-2">
                                <OverallStatistics homeTeam={data.homeTeam} awayTeam={data.awayTeam} />
                            </div>
                        )}

                        {/* --- OVER/UNDER STATISTICS SECTION --- */}
                        {hasAnyMatches && data?.homeTeam && data?.awayTeam && (
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
                                    <h3 className="inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-1 bg-gray-100 backdrop-blur-sm border border-gray-300 text-teal-700 rounded-lg sm:rounded-xl text-[11px] font-bold shadow-xs tracking-wide uppercase">
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
                                    <h3 className="inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-1 bg-gray-100 backdrop-blur-sm border border-gray-300 text-teal-700 rounded-lg sm:rounded-xl text-[11px] font-bold shadow-xs tracking-wide uppercase">
                                        Recent Form
                                    </h3>
                                </div>

                                {/* Home Team Form */}
                                {homeMatches.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center px-1">
                                            <div className="flex items-center gap-2">
                                                {data.homeTeam.logo && (
                                                    <img
                                                        src={data.homeTeam.logo}
                                                        alt={data.homeTeam.name}
                                                        className="w-5 h-5 object-contain"
                                                    />
                                                )}
                                                <span className="text-[10px] sm:text-[11px] font-bold text-gray-800 uppercase truncate max-w-[150px]">
                                                    {data.homeTeam.name}
                                                </span>
                                            </div>
                                            <div className="flex gap-1 bg-gray-100 p-0.5 rounded border border-gray-300 shadow-xs">
                                                <button
                                                    onClick={() => setHomeTab("all")}
                                                    className={`px-2 py-1 rounded text-[9px] font-bold transition-colors ${
                                                        homeTab === "all"
                                                            ? "bg-white text-gray-900 shadow-xs"
                                                            : "text-gray-600 hover:text-gray-800"
                                                    }`}
                                                >
                                                    Recent Form
                                                </button>
                                                <button
                                                    onClick={() => setHomeTab("home")}
                                                    className={`px-2 py-1 rounded text-[9px] font-bold transition-colors ${
                                                        homeTab === "home"
                                                            ? "bg-white text-gray-900 shadow-xs"
                                                            : "text-gray-600 hover:text-gray-800"
                                                    }`}
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
                                                {data.awayTeam.logo && (
                                                    <img
                                                        src={data.awayTeam.logo}
                                                        alt={data.awayTeam.name}
                                                        className="w-5 h-5 object-contain"
                                                    />
                                                )}
                                                <span className="text-[10px] sm:text-[11px] font-bold text-gray-800 uppercase truncate max-w-[150px]">
                                                    {data.awayTeam.name}
                                                </span>
                                            </div>
                                            <div className="flex gap-1 bg-gray-100 p-0.5 rounded border border-gray-300 shadow-xs">
                                                <button
                                                    onClick={() => setAwayTab("all")}
                                                    className={`px-2 py-1 rounded text-[9px] font-bold transition-colors ${
                                                        awayTab === "all"
                                                            ? "bg-white text-gray-900 shadow-xs"
                                                            : "text-gray-600 hover:text-gray-800"
                                                    }`}
                                                >
                                                    Recent Form
                                                </button>
                                                <button
                                                    onClick={() => setAwayTab("away")}
                                                    className={`px-2 py-1 rounded text-[9px] font-bold transition-colors ${
                                                        awayTab === "away"
                                                            ? "bg-white text-gray-900 shadow-xs"
                                                            : "text-gray-600 hover:text-gray-800"
                                                    }`}
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
                                    <h3 className="inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-1 bg-gray-100 backdrop-blur-sm border border-gray-300 text-teal-700 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-bold shadow-xs tracking-wide uppercase">
                                        League Table
                                    </h3>
                                </div>
                                <div>
                                    <Standings
                                        standings={data.standings || []}
                                        homeTeamId={data.homeTeam.id}
                                        awayTeamId={data.awayTeam.id}
                                    />
                                </div>
                            </div>
                        )}

                        {/* --- INJURIES SECTION --- */}
                        {displayInjuries && displayInjuries.length > 0 && (
                            <div className="mt-2">
                                <div className="flex justify-center mb-3">
                                    <h3 className="inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-1 bg-gray-100 backdrop-blur-sm border border-gray-300 text-teal-700 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-bold shadow-xs tracking-wide uppercase">
                                        Injuries & Suspensions
                                    </h3>
                                </div>
                                <div>
                                    <Injuries injuries={displayInjuries} />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-8">
                <Footer />
            </div>
        </div>
    );
};

export default FixtureDetailsClient;
