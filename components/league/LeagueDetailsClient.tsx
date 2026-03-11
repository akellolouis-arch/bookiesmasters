"use client";

import React, { useState } from "react";
import useSWR from "swr";
import Standings from "@/components/fixture-details/Standings";

import LeagueFixtures from "@/components/home/LeagueExplorer/LeagueFixtures";
import Link from "next/link";

interface LeagueDetailsClientProps {
    id: number;
    name: string;
    logo: string;
    country?: string;
    embedded?: boolean;
}

const fetcher = (url: string) => fetch(url).then(res => res.json()).then(json => json.data);

export default function LeagueDetailsClient({ id, name, logo, country, embedded = false }: LeagueDetailsClientProps) {
    const [activeTab, setActiveTab] = useState<"fixtures" | "standings">("standings");

    // Fetch Data based on active tab
    // 1. Standings
    const { data: standings, isLoading: isLoadingStandings } = useSWR(
        activeTab === "standings" ? `${process.env.NEXT_PUBLIC_API_URL}/api/leagues/${id}/standings` : null,
        fetcher
    );



    // 3. Fixtures
    const { data: fixtures, isLoading: isLoadingFixtures } = useSWR(
        activeTab === "fixtures" ? `${process.env.NEXT_PUBLIC_API_URL}/api/leagues/${id}/fixtures` : null,
        fetcher
    );

    return (
        <div className={`text-white ${embedded ? 'min-h-0 pb-0' : 'min-h-screen bg-zinc-950 pb-20'}`}>

            {/* Navbar / Back Button (Only if NOT embedded) */}
            {!embedded && (
                <div className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
                    <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
                        <Link href="/" className="p-2 -ml-2 text-gray-400 hover:text-white transition">
                            ← Back
                        </Link>
                        <div className="font-bold text-sm">League Details</div>
                        <div className="w-8"></div> {/* Spacer */}
                    </div>
                </div>
            )}

            <div className={embedded ? "w-full" : "max-w-3xl mx-auto"}>

                {/* Header */}
                {embedded ? (
                    <div className="flex items-start gap-3 py-4 pl-1">
                        <div className="relative">
                            <img src={logo} alt={name} className="w-10 h-10 object-contain relative z-10" />
                        </div>
                        <div className="flex flex-col items-start leading-none gap-1">
                            <h2 className="text-sm font-bold text-gray-200 uppercase tracking-widest">{name}</h2>
                            {country && (
                                <span className="text-[10px] font-medium text-gray-500 uppercase">
                                    {country}
                                </span>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-6 flex flex-col items-center justify-center gap-4 py-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full"></div>
                            <img src={logo} alt={name} className="w-20 h-20 object-contain relative z-10 drop-shadow-lg" />
                        </div>
                        <h1 className="text-2xl font-bold text-center">{name}</h1>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-zinc-800 bg-zinc-900/30 sticky top-14 z-40 backdrop-blur-md">
                    {[
                        { id: "standings", label: "Standings" },
                        { id: "fixtures", label: "Fixtures" },

                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === tab.id
                                ? "text-orange-400"
                                : "text-gray-500 hover:text-gray-300"
                                }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="p-4 min-h-[400px]">
                    {activeTab === "standings" && (
                        isLoadingStandings ? <LoadingState /> :
                            standings?.standings ? <Standings standings={standings.standings} /> : <EmptyState msg="No standings available" />
                    )}



                    {activeTab === "fixtures" && (
                        isLoadingFixtures ? <LoadingState /> :
                            fixtures ? <LeagueFixtures fixtures={fixtures} /> : <EmptyState msg="No fixtures available" />
                    )}
                </div>
            </div>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-500 animate-pulse">
            <div className="w-8 h-8 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin"></div>
            <p className="text-xs font-medium tracking-wider">LOADING...</p>
        </div>
    );
}

function EmptyState({ msg }: { msg: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <p>{msg}</p>
        </div>
    );
}
