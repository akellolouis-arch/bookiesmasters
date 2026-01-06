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


interface FixtureDetailsClientProps {
    data: any;
}

import { useSession } from "next-auth/react";
import { Lock } from "lucide-react";
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
    const { data: session, update } = useSession();
    const [activeTab, setActiveTab] = useState("events");
    const [unlocking, setUnlocking] = useState(false);
    const [justUnlocked, setJustUnlocked] = useState(false);

    // VIP Logic
    // @ts-ignore
    const unlockedTips = session?.user?.unlockedTips || [];
    // @ts-ignore
    const userCredits = session?.user?.credits || 0;

    const isVip = data.isVip;
    const isUnlocked = !isVip || justUnlocked || unlockedTips.includes(String(data.fixtureId));
    const creditCost = data.creditCost || 20;

    const handleUnlock = async () => {
        if (!session) {
            router.push("/login"); // Client-side redirect
            return;
        }
        if (userCredits < creditCost) {
            alert("Insufficient credits! Please top up.");
            return;
        }
        if (!confirm(`Unlock this tip for ${creditCost} Credits?`)) return;

        setUnlocking(true);
        try {
            const res = await fetch("/api/tips/unlock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fixtureId: data.fixtureId }),
            });
            const resData = await res.json();
            if (resData.success) {
                // Update session credits in background
                await update();
                // Reveal tip instantly
                setJustUnlocked(true);
            } else {
                alert(resData.error || "Failed");
            }
        } catch (e) {
            alert("Error unlocking");
        } finally {
            setUnlocking(false);
        }
    };


    const tabs = [
        { id: "events", label: "Events" }, // ... existing tabs
        { id: "stats", label: "Stats" },
        { id: "lineups", label: "Lineups" },
        { id: "injuries", label: "Injuries" },
        { id: "h2h", label: "H2H" },
        { id: "last5", label: "Last 5" },
        { id: "standings", label: "Standings" },
    ];

    const renderContent = () => {
        switch (activeTab) {
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
                            matches={data.homeTeam.last5Matches}
                        />
                        <LastFiveMatches
                            teamName={data.awayTeam.name}
                            teamLogo={data.awayTeam.logo}
                            matches={data.awayTeam.last5Matches}
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
                />

                {/* VIP UNLOCK SECTION */}
                {isVip && !isUnlocked && (
                    <div className="bg-[#1e1e1e] border border-yellow-500/30 rounded-lg p-4 flex flex-col items-center gap-3 animate-in fade-in">
                        <div className="flex items-center gap-2 text-yellow-500">
                            <Lock className="w-5 h-5" />
                            <span className="font-bold">VIP Tip Locked</span>
                        </div>
                        <button
                            onClick={handleUnlock}
                            disabled={unlocking}
                            className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition"
                        >
                            {unlocking ? "Unlocking..." : `unlock ${data.customOdds || '2.00'} odds for ${creditCost}credits`}
                        </button>
                    </div>
                )}

                {/* VIP PREDICTION REVEALED */}
                {isVip && isUnlocked && (
                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 flex items-center justify-between px-4 animate-in fade-in">
                        <div className="flex items-center gap-2 text-green-400">
                            <span className="font-bold">Odds: {data.customOdds || '2.00'}</span>
                        </div>
                        <div className="text-green-400 font-bold rounded transition flex items-center gap-2">
                            Prediction: {data.prediction || data.tip}
                        </div>
                    </div>
                )}

                <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

                {renderContent()}

            </div>
        </div>
    );
};

export default FixtureDetailsClient;
