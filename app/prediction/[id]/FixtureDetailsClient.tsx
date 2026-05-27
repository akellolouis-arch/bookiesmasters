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
                />

                {/* --- OVERVIEW SECTION --- */}
                <div className="mt-2">
                </div>

                {/* --- H2H & FORM SECTION --- */}
                <div className="mt-2">
                    <div className={`grid grid-cols-1 ${data.h2h && data.h2h.length > 0 ? "lg:grid-cols-2" : "lg:grid-cols-1"} gap-2`}>
                        {/* Column 1: Head to Head */}
                        {data.h2h && data.h2h.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex justify-center mb-3">
                                    <h3 className="inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-1 bg-white/5 backdrop-blur-sm border border-white/10 text-amber-100 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold shadow-lg tracking-wide uppercase">
                                        Head to Head
                                    </h3>
                                </div>
                                <div>
                                    <H2HSection h2h={data.h2h} />
                                </div>
                            </div>
                        )}

                        {/* Column 2: Recent Form */}
                        <div className="space-y-2">
                            <div className="flex justify-center mb-3">
                                <h3 className="inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-1 bg-white/5 backdrop-blur-sm border border-white/10 text-amber-100 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold shadow-lg tracking-wide uppercase">
                                    Recent Form
                                </h3>
                            </div>
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
                    </div>
                </div>

                {/* --- OVERALL STATISTICS SECTION --- */}
                <div className="mt-2">
                    <OverallStatistics homeTeam={data.homeTeam} awayTeam={data.awayTeam} />
                </div>

                {/* --- OVER/UNDER STATISTICS SECTION --- */}
                <div className="mt-2">
                    <OverUnderStatistics homeTeam={data.homeTeam} awayTeam={data.awayTeam} />
                </div>

                {/* --- BTTS STATISTICS SECTION --- */}
                <div className="mt-2">
                    <BTTSStatistics homeTeam={data.homeTeam} awayTeam={data.awayTeam} />
                </div>

                {/* --- SPLIT HOME & AWAY MATCHES SECTION --- */}
                <div className="mt-2">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                        {/* Home Matches Section */}
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
                                    matches={(data.homeTeam.allMatches || data.homeTeam.last5Matches || []).filter((m: any) => m.homeTeam.name === data.homeTeam.name)}
                                />
                            </div>
                        </div>

                        {/* Away Matches Section */}
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
                                    matches={(data.awayTeam.allMatches || data.awayTeam.last5Matches || []).filter((m: any) => m.awayTeam.name === data.awayTeam.name)}
                                />
                            </div>
                        </div>
                    </div>
                </div>



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
