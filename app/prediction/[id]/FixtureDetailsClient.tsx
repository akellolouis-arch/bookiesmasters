"use client";

import React from "react";
import H2HSection from "@/components/fixture-details/H2HSection";
import LastFiveMatches from "@/components/fixture-details/LastFiveMatches";
// import Events from "@/components/fixture-details/Events";
import Standings from "@/components/fixture-details/Standings";
// import Odds from "@/components/fixture-details/Odds";
import TeamDisplay from "@/components/fixture-details/TeamDisplay";
import LeagueHeader from "@/components/fixture-details/LeagueHeader";
// import Lineups from "@/components/fixture-details/Lineups";
import Injuries from "@/components/fixture-details/Injuries";
// import Statistics from "@/components/fixture-details/Statistics";
import BetButton from "@/components/BetButton";

// import PredictionDisplay from "@/components/fixture-details/PredictionDisplay";
// import PredictionDisplay from "@/components/fixture-details/PredictionDisplay";


type GoalPredictions = {
    markets?: {
        over15?: { pick: string; probability: number };
        under35?: { pick: string; probability: number };
    };
};

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
    liveOdds?: any[];
    injuries?: any[];
    h2h?: any[];
    standings?: any[];
    homeTeam: { id: number; name: string; logo: string; last5Matches?: any[]; allMatches?: any[] };
    awayTeam: { id: number; name: string; logo: string; last5Matches?: any[]; allMatches?: any[] };
    goalPredictions?: GoalPredictions | null;
};

interface FixtureDetailsClientProps {
    data: FixtureDetailsData;
}

const FixtureDetailsClient: React.FC<FixtureDetailsClientProps> = ({ data: initialData }) => {
    // Live Polling Disabled
    // const { data } = useSWR(...)
    const data = initialData; // Use initial data only

    return (
        <div className="min-h-screen bg-transparent text-white py-4 px-2">
            <div className="max-w-xl mx-auto space-y-4">
                <LeagueHeader league={data.league} logo={data.leagueLogo} country={data.country} id={data.leagueId} />

                <TeamDisplay
                    homeTeam={data.homeTeam}
                    awayTeam={data.awayTeam}
                    status={data.status}
                    displayDate={data.displayDate}
                    venue={data.venue}
                    date={data.date}
                    score={data.score}
                    tip={data.tip}
                    goalPredictions={data.goalPredictions}
                />




                {/* ADVICE DISPLAY (Below Team Display) */}
                {data.apiPrediction?.advice && (
                    <div className="flex justify-center -mt-2 mb-4 animate-in fade-in slide-in-from-top-2">
                        <div className="text-center bg-[#1e1e1e]/50 border-b border-white/5 py-2 px-4 rounded-xl">
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Prediction Advice</div>
                            <div className="text-sm text-gray-200 font-medium italic">
                                &quot;{data.apiPrediction.advice}&quot;
                            </div>
                        </div>
                    </div>
                )}

                {/* AFFILIATE CALL TO ACTION */}
                <div className="flex flex-col items-center gap-3 mb-6">
                    <BetButton
                        teamName={data.homeTeam.name}
                        isLive={["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"].includes(data.status) || data.status.includes("'")}
                        odds={
                            // 2. Fallback to pre-match odds (Default now)
                            (data.odds && data.odds.length > 0 && data.odds[0].markets && data.odds[0].markets.length > 0)
                                ? data.odds[0].markets[0].values
                                : undefined
                        }
                    />
                </div>

                {/* VIP SECTION REMOVED */}

                {/* VERTICAL CONTENT STACK (Replacing Tabs) */}
                <div className="space-y-8 mt-6">
                    {/* Injuries Section */}
                    {data.injuries && data.injuries.length > 0 && (
                        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5">
                            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-4 bg-orange-500 rounded-full" />
                                Match Injuries
                            </h3>
                            <Injuries injuries={data.injuries} />
                        </div>
                    )}

                    {/* H2H Section */}
                    {data.h2h && data.h2h.length > 0 && (
                        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5">
                            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-4 bg-orange-500 rounded-full" />
                                Head to Head
                            </h3>
                            <H2HSection h2h={data.h2h} />
                        </div>
                    )}

                    {/* Last 5 Matches (Form) */}
                    <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5">
                        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-1 h-4 bg-orange-500 rounded-full" />
                            Recent Form (Last 5)
                        </h3>
                        <div className="space-y-6">
                            <LastFiveMatches
                                teamName={data.homeTeam.name}
                                teamLogo={data.homeTeam.logo}
                                matches={data.homeTeam.allMatches || data.homeTeam.last5Matches}
                            />
                            <div className="text-xs text-red-500 hidden">Matches: {data.homeTeam.allMatches?.length} / {data.homeTeam.last5Matches?.length}</div>
                            <LastFiveMatches
                                teamName={data.awayTeam.name}
                                teamLogo={data.awayTeam.logo}
                                matches={data.awayTeam.allMatches || data.awayTeam.last5Matches}
                            />
                        </div>
                    </div>

                    {/* Standings Section (LAST) */}
                    {data.standings && data.standings.length > 0 && (
                        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5">
                            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-4 bg-orange-500 rounded-full" />
                                League Standings
                            </h3>
                            <Standings standings={data.standings} />
                        </div>
                    )}
                </div>



            </div>
        </div>
    );
};

export default FixtureDetailsClient;
