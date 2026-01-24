"use client";

import React, { useState } from "react";
import Tabs from "@/components/Tabs";
import H2HSection from "@/components/fixture-details/H2HSection";
import LastFiveMatches from "@/components/fixture-details/LastFiveMatches";
import Events from "@/components/fixture-details/Events";
import Standings from "@/components/fixture-details/Standings";
// import Odds from "@/components/fixture-details/Odds";
import TeamDisplay from "@/components/fixture-details/TeamDisplay";
import LeagueHeader from "@/components/fixture-details/LeagueHeader";
import Lineups from "@/components/fixture-details/Lineups";
import Injuries from "@/components/fixture-details/Injuries";
import Statistics from "@/components/fixture-details/Statistics";
import BetButton from "@/components/BetButton";

// import PredictionDisplay from "@/components/fixture-details/PredictionDisplay";
// import PredictionDisplay from "@/components/fixture-details/PredictionDisplay";


interface FixtureDetailsClientProps {
    data: any;
}

import { useSession } from "next-auth/react";
// import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json().then(json => json.data));

const FixtureDetailsClient: React.FC<FixtureDetailsClientProps> = ({ data: initialData }) => {
    const { data } = useSWR(
        `${process.env.NEXT_PUBLIC_API_URL}/api/fixtures/${initialData.fixtureId}`,
        fetcher,
        {
            fallbackData: initialData,
            refreshInterval: 1000,
            revalidateOnFocus: false,
        }
    );
    const router = useRouter();
    // const { data: session, update } = useSession();
    const [activeTab, setActiveTab] = useState("events"); // Default to events
    // const [unlocking, setUnlocking] = useState(false);
    // const [justUnlocked, setJustUnlocked] = useState(false);

    // VIP Logic REMOVED

    // Check if we have prediction info to show the tab
    // const hasPrediction = data.tip && data.tip !== "N/A" || data.apiPrediction;

    const tabs = [
        // ...(hasPrediction ? [{ id: "prediction", label: "Prediction" }] : []), // Removed
        { id: "events", label: "Events" },
        { id: "stats", label: "Stats" },
        { id: "lineups", label: "Lineups" },
        { id: "injuries", label: "Injuries" },
        { id: "h2h", label: "H2H" },
        { id: "last5", label: "Last 5" },
        { id: "standings", label: "Standings" },
    ];

    const renderContent = () => {
        switch (activeTab) {
            // case "prediction":
            // removed
            case "events":
                return <Events events={data.events} homeTeamId={data.homeTeam.id} awayTeamId={data.awayTeam.id} />;
            case "lineups":
                return <Lineups lineups={data.lineups} />;
            case "injuries":
                return <Injuries injuries={data.injuries} />;
            case "stats":
                return <Statistics stats={data.statistics} />;
            case "h2h":
                return <H2HSection h2h={data.h2h} />;
            case "last5":
                return (
                    <div className="space-y-6">
                        <LastFiveMatches
                            teamName={data.homeTeam.name}
                            teamLogo={data.homeTeam.logo}
                            matches={data.homeTeam.allMatches || data.homeTeam.last5Matches}
                        />
                        {/* DEBUG: */}
                        <div className="text-xs text-red-500 hidden">Matches: {data.homeTeam.allMatches?.length} / {data.homeTeam.last5Matches?.length}</div>
                        <LastFiveMatches
                            teamName={data.awayTeam.name}
                            teamLogo={data.awayTeam.logo}
                            matches={data.awayTeam.allMatches || data.awayTeam.last5Matches}
                        />
                    </div>
                );
            case "standings":
                return <Standings standings={data.standings} />;
            default:
                return null;
        }
    };

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
                />




                {/* ADVICE DISPLAY (Below Team Display) */}
                {data.apiPrediction?.advice && (
                    <div className="flex justify-center -mt-2 mb-4 animate-in fade-in slide-in-from-top-2">
                        <div className="text-center bg-[#1e1e1e]/50 border-b border-white/5 py-2 px-4 rounded-xl">
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Prediction Advice</div>
                            <div className="text-sm text-gray-200 font-medium italic">"{data.apiPrediction.advice}"</div>
                        </div>
                    </div>
                )}

                {/* AFFILIATE CALL TO ACTION */}
                <div className="flex flex-col items-center gap-3 mb-6">
                    <BetButton teamName={data.homeTeam.name} />

                    {/* ODDS DISPLAY */}
                    {data.odds && data.odds.length > 0 && data.odds[0].markets && data.odds[0].markets.length > 0 && (
                        <div className="flex gap-2">
                            {data.odds[0].markets[0].values.map((v: any, idx: number) => (
                                <div key={idx} className="bg-[#1a1a1a] border border-white/10 rounded px-3 py-1 text-center min-w-[50px]">
                                    <div className="text-[10px] text-gray-500 font-bold mb-0.5">
                                        {v.value === "Home" ? "1" : v.value === "Draw" ? "X" : "2"}
                                    </div>
                                    <div className="text-sm font-bold text-white">{v.odd}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* VIP SECTION REMOVED */}

                <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

                {renderContent()}



            </div>
        </div>
    );
};

export default FixtureDetailsClient;
