"use client";

import React from "react";
import useSWR from "swr";
import H2HSection from "@/components/fixture-details/H2HSection";
import LastFiveMatches from "@/components/fixture-details/LastFiveMatches";
import Events from "@/components/fixture-details/Events";
import Standings from "@/components/fixture-details/Standings";
import TeamDisplay from "@/components/fixture-details/TeamDisplay";
import Injuries from "@/components/fixture-details/Injuries";
import BetButton from "@/components/BetButton";

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
    score?: { home: number | null; away: number | null } | null;
    tip?: string | null;
    apiPrediction?: { advice?: string } | null;
    odds?: any[];
    injuries?: any[];
    h2h?: any[];
    standings?: any[];
    events?: any[];
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

    const isLive = data.status ? (["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"].includes(data.status) || data.status.includes("'")) : false;
    const primaryOdds = (data.odds && data.odds.length > 0 && data.odds[0].markets && data.odds[0].markets.length > 0)
        ? data.odds[0].markets[0].values
        : undefined;

    const isFinishedCache = ["FT", "AET", "PEN"].includes(initialData.status);
    const hideStaleData = !isFinishedCache && !swrData;

    const displayEvents = hideStaleData ? [] : data.events;
    const displayInjuries = hideStaleData ? [] : data.injuries;

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
                    tip={data.tip}
                    league={data.league}
                    isLoading={hideStaleData}
                />

                {/* --- ODDS & ADVICE SECTION --- */}
                <div className="flex flex-col gap-1 my-1">
                    {/* Call To Action Box (Odds) */}
                    <div className="flex flex-col items-center justify-center text-center">
                        <h3 className="text-[10px] font-bold text-gray-500 tracking-widest mb-2">Prematch odds</h3>
                        <BetButton teamName={data.homeTeam.name} isLive={isLive} odds={primaryOdds} />
                    </div>

                    {/* Prediction Advice Panel */}
                    {data.apiPrediction?.advice && (
                        <div className="flex flex-col items-center justify-center text-center mt-1">
                            <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-2 mb-2">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                Expert Advice
                            </h3>
                            <p className="text-sm text-emerald-100/90 font-medium leading-relaxed italic">
                                &quot;{data.apiPrediction.advice}&quot;
                            </p>
                        </div>
                    )}
                </div>

                {/* --- OVERVIEW SECTION --- */}
                <div className="mt-2">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
                        {/* Left Column: Match Events */}
                        {displayEvents && displayEvents.length > 0 && (
                            <div className="lg:col-span-7 space-y-2">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-200 capitalize tracking-widest flex items-center gap-2">
                                        <span className="w-1.5 h-5 bg-blue-500 rounded-full" />
                                        Match Events
                                    </h3>
                                    <div>
                                        <Events events={displayEvents} homeTeamId={data.homeTeam.id} awayTeamId={data.awayTeam.id} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Right Column: Insights, Action, Injuries */}
                        <div className={`${displayEvents && displayEvents.length > 0 ? "lg:col-span-5" : "lg:col-span-12"} space-y-2`}>
                            {/* Injuries Panel */}
                            {displayInjuries && displayInjuries.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-200 capitalize tracking-widest flex items-center gap-2">
                                        <span className="w-1.5 h-5 bg-rose-500 rounded-full" />
                                        Injuries & Suspensions
                                    </h3>
                                    <div>
                                        <Injuries injuries={displayInjuries} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- H2H & FORM SECTION --- */}
                <div className="mt-2">
                    <div className={`grid grid-cols-1 ${data.h2h && data.h2h.length > 0 ? "lg:grid-cols-2" : "lg:grid-cols-1"} gap-2`}>
                        {/* Column 1: Recent Form */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-gray-200 capitalize tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
                                Recent Form
                            </h3>
                            <div className="space-y-2">
                                <LastFiveMatches
                                    teamName={data.homeTeam.name}
                                    teamLogo={data.homeTeam.logo}
                                    matches={data.homeTeam.allMatches || data.homeTeam.last5Matches || []}
                                />
                                <div className="w-full h-px bg-white/5"></div>
                                <LastFiveMatches
                                    teamName={data.awayTeam.name}
                                    teamLogo={data.awayTeam.logo}
                                    matches={data.awayTeam.allMatches || data.awayTeam.last5Matches || []}
                                />
                            </div>
                        </div>

                        {/* Column 2: Head to Head */}
                        {data.h2h && data.h2h.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-bold text-gray-200 capitalize tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-5 bg-orange-500 rounded-full" />
                                    Head to Head
                                </h3>
                                <div>
                                    <H2HSection h2h={data.h2h} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- STANDINGS SECTION --- */}
                {data.standings && data.standings.length > 0 && (
                    <div className="mt-2">
                        <h3 className="text-sm font-bold text-gray-200 capitalize tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-purple-500 rounded-full" />
                            League Table
                        </h3>
                        <div>
                            <Standings standings={data.standings || []} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FixtureDetailsClient;
