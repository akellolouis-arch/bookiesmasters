"use client";

import React from "react";
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

    const hasH2H = data.h2h && data.h2h.length > 0;
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
    if (!computedTip && hasAnyMatches && data.h2h) {
        const homeStats = calculateStats(homeMatches, 5);
        const awayStats = calculateStats(awayMatches, 5);
        const h2hStats = calculateStats(data.h2h, 5);
        if (homeStats.total > 0 && awayStats.total > 0 && h2hStats.total > 0) {
            if (homeStats.over25 >= homeStats.under25 && awayStats.over25 >= awayStats.under25 && h2hStats.over25 >= h2hStats.under25) {
                computedTip = "Over 1.5 Goals";
            } else if (homeStats.under25 >= homeStats.over25 && awayStats.under25 >= awayStats.over25 && h2hStats.under25 >= h2hStats.over25) {
                computedTip = "Under 3.5 Goals";
            }
        }
    }

    return (
        <div className="text-white pt-1 pb-4 px-2 sm:px-4">
            <div className="max-w-5xl mx-auto">
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
                        h2hMatches={data.h2h}
                        status={data.status}
                        score={data.score}
                    />
                </div>

                {/* --- OVERVIEW SECTION --- */}
                <div className="mt-2">
                </div>

                {/* --- H2H & FORM SECTION --- */}
                {(hasH2H || hasAnyMatches) && (
                    <div className="mt-2">
                        <div className={`grid grid-cols-1 ${hasH2H && hasAnyMatches ? "lg:grid-cols-2" : "lg:grid-cols-1"} gap-2`}>
                            {/* Column 1: Head to Head */}
                            {hasH2H && (
                                <div className="space-y-2">
                                    <div className="flex justify-center mb-3">
                                        <h3 className="inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-1 bg-white/5 backdrop-blur-sm border border-white/10 text-amber-100 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold shadow-lg tracking-wide uppercase">
                                            Head to Head
                                        </h3>
                                    </div>
                                    <div>
                                        <H2HSection h2h={data.h2h!} />
                                    </div>
                                </div>
                            )}

                            {/* Column 2: Recent Form */}
                            {hasAnyMatches && (
                                <div className="space-y-2">
                                    <div className="flex justify-center mb-3">
                                        <h3 className="inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-1 bg-white/5 backdrop-blur-sm border border-white/10 text-amber-100 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold shadow-lg tracking-wide uppercase">
                                            Recent Form
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        {homeMatches.length > 0 && (
                                            <LastFiveMatches
                                                teamName={data.homeTeam.name}
                                                teamLogo={data.homeTeam.logo}
                                                matches={homeMatches}
                                            />
                                        )}
                                        {homeMatches.length > 0 && awayMatches.length > 0 && (
                                            <div className="w-full h-px bg-white/5"></div>
                                        )}
                                        {awayMatches.length > 0 && (
                                            <LastFiveMatches
                                                teamName={data.awayTeam.name}
                                                teamLogo={data.awayTeam.logo}
                                                matches={awayMatches}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

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

                {/* --- SPLIT HOME & AWAY MATCHES SECTION --- */}
                {hasSplitMatches && (
                    <div className="mt-2">
                        <div className={`grid grid-cols-1 ${hasHomeHomeMatches && hasAwayAwayMatches ? "lg:grid-cols-2" : "lg:grid-cols-1"} gap-2`}>
                            {/* Home Matches Section */}
                            {hasHomeHomeMatches && (
                                <div className="space-y-2">
                                    <div className="flex justify-center mb-3">
                                        <h3 className="inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-1 bg-white/5 backdrop-blur-sm border border-white/10 text-amber-100 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold shadow-lg tracking-wide uppercase">
                                            Home Matches
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        <LastFiveMatches
                                            teamName={data.homeTeam.name}
                                            teamLogo={data.homeTeam.logo}
                                            matches={homeHomeMatches}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Away Matches Section */}
                            {hasAwayAwayMatches && (
                                <div className="space-y-2">
                                    <div className="flex justify-center mb-3">
                                        <h3 className="inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-1 bg-white/5 backdrop-blur-sm border border-white/10 text-amber-100 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold shadow-lg tracking-wide uppercase">
                                            Away Matches
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        <LastFiveMatches
                                            teamName={data.awayTeam.name}
                                            teamLogo={data.awayTeam.logo}
                                            matches={awayAwayMatches}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}



                {/* --- STANDINGS SECTION --- */}
                {data.standings && data.standings.length > 0 && (
                    <div className="mt-2">
                        <div className="flex justify-center mb-3">
                            <h3 className="inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-1 bg-white/5 backdrop-blur-sm border border-white/10 text-amber-100 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold shadow-lg tracking-wide uppercase">
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
                            <h3 className="inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-1 bg-white/5 backdrop-blur-sm border border-white/10 text-amber-100 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold shadow-lg tracking-wide uppercase">
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
