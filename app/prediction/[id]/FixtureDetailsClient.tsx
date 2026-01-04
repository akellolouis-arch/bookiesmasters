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

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json().then(json => json.data));

const FixtureDetailsClient: React.FC<FixtureDetailsClientProps> = ({ data: initialData }) => {
    const { data } = useSWR(
        `${process.env.NEXT_PUBLIC_API_URL}/api/fixtures/${initialData.fixtureId}`,
        fetcher,
        {
            fallbackData: initialData,
            refreshInterval: 1000, // Update every 5s for minimal lag
            revalidateOnFocus: false,
        }
    );

    const [activeTab, setActiveTab] = useState("events");

    const tabs = [
        { id: "events", label: "Events" },
        { id: "stats", label: "Stats" },
        { id: "lineups", label: "Lineups" },
        { id: "injuries", label: "Injuries" },
        { id: "h2h", label: "H2H" },
        { id: "last5", label: "Last 5" },
        { id: "standings", label: "Standings" },
        // Odds tab removed
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
            // case "odds": return <Odds ... />;
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

                <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

                {renderContent()}

            </div>
        </div>
    );
};

export default FixtureDetailsClient;
