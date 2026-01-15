"use client";

import Image from "next/image";
import Link from "next/link";
// import { Lock } from "lucide-react";
// import { useSession, signIn } from "next-auth/react";
// import { useState } from "react";

export interface Odds {
  home: string | null;
  draw: string | null;
  away: string | null;
}

export interface Team {
  id: number;
  name: string;
  logo: string;
}

export interface FixtureCardProps {
  fixtureId: number;
  status: string;
  homeTeam: Team;
  awayTeam: Team;
  odds: Odds;
  score: string | null;
  prediction?: string | null; // This is now the TIP (1, X, 1X, Over 2.5 etc)
  // customOdds?: string | null; // We can use this if we want to show manual odds
  // isVip?: boolean; // REMOVED
  // creditCost?: number; // REMOVED
}

export default function FixtureCard({
  fixtureId,
  status,
  homeTeam,
  awayTeam,
  odds,
  score,
  prediction, // This is the TIP
}: FixtureCardProps) {
  const isLive = status.includes("'") || status === "HT" || status === "Live";

  // helper function
  function getOddsColor(
    value: string | null,
    allOdds: (string | null)[]
  ): string {
    if (!value) return "text-gray-400";

    // Convert all odds to numbers, ignore nulls
    const nums = allOdds.map(o => (o ? Number(o) : NaN)).filter(n => !isNaN(n));
    const num = Number(value);

    if (nums.every(n => n === num)) {
      // All odds are the same
      return "text-orange-400";
    }

    const max = Math.max(...nums);
    const min = Math.min(...nums);

    // Check for ties
    const countMax = nums.filter(n => n === max).length;
    const countMin = nums.filter(n => n === min).length;

    if (num === min && countMin === 1) return "text-green-600"; // lowest unique → green
    if (num === max && countMax === 1) return "text-red-600";   // highest unique → red
    return "text-orange-400"; // second highest OR tied values → orange
  }




  // -------------------------
  // VIP LOGIC REMOVED
  // -------------------------

  return (
    <div className="relative group max-w-xl mx-auto mb-3">
      {/* Main Card Content - Clickable (Details Page) */}
      <Link href={`/prediction/${fixtureId}`}
        className={`block bg-[#1F1F1F] rounded-xl shadow-sm hover:shadow-md hover:bg-[#2a2a2a] transition flex items-center justify-evenly p-3 border-l-4 border-r border-t border-b border-r-white/5 border-t-white/5 border-b-white/5 ${isLive ? "border-l-red-500" : "border-l-transparent"}`}
      >
        {/* STATUS */}
        <div className="w-[45px] sm:w-[50px] text-left pl-1">
          <p className={`text-[10px] sm:text-xs leading-none font-bold ${isLive ? "text-red-500 animate-pulse" : "text-gray-500"}`}>
            {status}
          </p>
        </div>

        {/* TEAMS */}
        <div className="flex flex-col items-start text-left mx-2 w-[140px] sm:w-[180px] gap-1">
          <div className="flex items-center gap-2">
            <Image src={homeTeam.logo} alt={homeTeam.name} width={14} height={14} className="w-3.5 h-3.5 object-contain" unoptimized />
            <span className="font-medium text-gray-200 text-xs truncate">{homeTeam.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Image src={awayTeam.logo} alt={awayTeam.name} width={14} height={14} className="w-3.5 h-3.5 object-contain" unoptimized />
            <span className="font-medium text-gray-200 text-xs truncate">{awayTeam.name}</span>
          </div>
        </div>

        {/* ODDS / LOCKED STATE */}
        <div className={`flex flex-row justify-between w-[100px] sm:w-[130px] ${isLive ? "animate-pulse" : ""}`}>
          <span className={`text-xs ${getOddsColor(odds.home, [odds.home, odds.draw, odds.away])}`}>{odds.home ?? "-"}</span>
          <span className={`text-xs ${getOddsColor(odds.draw, [odds.home, odds.draw, odds.away])}`}>{odds.draw ?? "-"}</span>
          <span className={`text-xs ${getOddsColor(odds.away, [odds.home, odds.draw, odds.away])}`}>{odds.away ?? "-"}</span>
        </div>

        {/* SCORE / TIP */}
        <div className={`text-right font-bold text-xs flex flex-col justify-center items-center w-[35px] sm:w-[45px] gap-1 ${isLive ? "text-red-500" : "text-gray-200"}`}>
          {score ? (
            <>
              <span>{score.split(" - ")[0]}</span>
              <span>{score.split(" - ")[1]}</span>
            </>
          ) : (
            /* Show TIP if score not available (NS) */
            prediction && prediction !== "N/A" ? (
              <span className="bg-green-900/80 text-green-400 px-1.5 py-1 rounded text-[10px] w-full text-center truncate border border-green-500/20">
                {prediction}
              </span>
            ) : null
          )}
        </div>
      </Link>

      {/* Remove VIP Footer Sections */}
    </div>
  );
}
