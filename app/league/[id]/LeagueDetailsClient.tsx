"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Award, Calendar } from "lucide-react";
import Standings from "@/components/fixture-details/Standings";
import LeagueTopScorers, { ScorerItem } from "@/components/league/LeagueTopScorers";
import LeagueMatchesList, { LeagueMatchItem } from "@/components/league/LeagueMatchesList";
import Footer from "@/components/Footer";

export interface LeagueDetailsData {
    league: {
        id: number;
        name: string;
        country?: string;
        logo?: string;
        flag?: string;
        season: number;
    };
    standings: any[][];
    topScorers: ScorerItem[];
    upcomingFixtures: LeagueMatchItem[];
    recentResults: LeagueMatchItem[];
}

interface LeagueDetailsClientProps {
    data: LeagueDetailsData;
}

const LeagueDetailsClient: React.FC<LeagueDetailsClientProps> = ({ data }) => {
    const [activeTab, setActiveTab] = useState<"table" | "matches" | "scorers">(() => {
        // Default to table if standings exist, otherwise matches
        if (data.standings && data.standings.length > 0) return "table";
        return "matches";
    });

    const league = data.league;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
            <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
                {/* Back Link */}
                <div className="mb-3">
                    <Link
                        href="/fixtures"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-teal-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Fixtures</span>
                    </Link>
                </div>

                {/* League Hero Banner */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-xs mb-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                        {league.logo ? (
                            <img
                                src={league.logo}
                                alt={league.name}
                                className="w-12 h-12 sm:w-16 sm:h-16 object-contain flex-shrink-0"
                            />
                        ) : (
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 font-bold text-lg flex-shrink-0">
                                <Trophy className="w-7 h-7 text-teal-600" />
                            </div>
                        )}

                        <div className="flex flex-col min-w-0">
                            <h1 className="text-lg sm:text-2xl font-black text-gray-900 truncate tracking-tight">
                                {league.name}
                            </h1>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {league.flag && (
                                    <img
                                        src={league.flag}
                                        alt={league.country || ""}
                                        className="w-4 h-3 object-cover rounded-xs"
                                    />
                                )}
                                {league.country && (
                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        {league.country}
                                    </span>
                                )}
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                                    Season {league.season}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="mb-4">
                    <div className="flex items-center justify-center p-1 bg-gray-100 rounded-xl border border-gray-200 shadow-xs gap-1 max-w-md mx-auto">
                        {/* 1. TABLE */}
                        <button
                            onClick={() => setActiveTab("table")}
                            className={`flex items-center justify-center gap-1.5 flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                                activeTab === "table"
                                    ? "bg-white text-teal-700 shadow-xs"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            <Trophy className="w-3.5 h-3.5 text-amber-500" />
                            <span>Table</span>
                        </button>

                        {/* 2. MATCHES */}
                        <button
                            onClick={() => setActiveTab("matches")}
                            className={`flex items-center justify-center gap-1.5 flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                                activeTab === "matches"
                                    ? "bg-white text-teal-700 shadow-xs"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Matches</span>
                        </button>

                        {/* 3. TOP SCORERS */}
                        <button
                            onClick={() => setActiveTab("scorers")}
                            className={`flex items-center justify-center gap-1.5 flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                                activeTab === "scorers"
                                    ? "bg-white text-teal-700 shadow-xs"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            <Award className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Top Scorers</span>
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="w-full">
                    {/* TAB 1: TABLE */}
                    {activeTab === "table" && (
                        <div className="bg-white rounded-xl shadow-xs p-3 sm:p-4 border border-gray-200 animate-in fade-in duration-300">
                            {data.standings && data.standings.length > 0 ? (
                                <Standings
                                    standings={data.standings}
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
                                        League standings are not applicable or currently unavailable for this competition.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: MATCHES */}
                    {activeTab === "matches" && (
                        <div className="animate-in fade-in duration-300">
                            <LeagueMatchesList
                                upcoming={data.upcomingFixtures || []}
                                results={data.recentResults || []}
                            />
                        </div>
                    )}

                    {/* TAB 3: TOP SCORERS */}
                    {activeTab === "scorers" && (
                        <div className="bg-white rounded-xl shadow-xs p-3 sm:p-4 border border-gray-200 animate-in fade-in duration-300">
                            <LeagueTopScorers scorers={data.topScorers || []} />
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8">
                <Footer />
            </div>
        </div>
    );
};

export default LeagueDetailsClient;
