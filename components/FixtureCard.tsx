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



  // helper function to validate tip
  function getTipStatus(tip: string, scoreString: string | null, status: string): "WIN" | "LOSS" | "PENDING" {
    if (!scoreString || status === "NS") return "PENDING";

    // Parse score "1 - 2"
    const parts = scoreString.split(" - ");
    if (parts.length !== 2) return "PENDING";
    const h = parseInt(parts[0]);
    const a = parseInt(parts[1]);

    // Normalize tip
    const t = tip.trim().toUpperCase();

    if (t === "1") return h > a ? "WIN" : "LOSS";
    if (t === "2") return a > h ? "WIN" : "LOSS";
    if (t === "X") return h === a ? "WIN" : "LOSS";
    if (t === "1X") return h >= a ? "WIN" : "LOSS";
    if (t === "X2") return a >= h ? "WIN" : "LOSS";
    if (t === "12") return h !== a ? "WIN" : "LOSS";

    // Basic Over/Under Support
    if (t.startsWith("OVER")) {
      const line = parseFloat(t.split(" ")[1]);
      if (!isNaN(line)) return (h + a) > line ? "WIN" : "LOSS";
    }
    if (t.startsWith("UNDER")) {
      const line = parseFloat(t.split(" ")[1]);
      if (!isNaN(line)) return (h + a) < line ? "WIN" : "LOSS";
    }

    return "PENDING"; // default if unknown format
  }

  const tipStatus = (prediction && prediction !== "N/A")
    ? getTipStatus(prediction, score, status)
    : "PENDING";

  let tipColor = "text-orange-300"; // Pale Orange (Pending)
  if (tipStatus === "WIN") tipColor = "text-green-500";
  if (tipStatus === "LOSS") tipColor = "text-red-500";

  return (
    <div className="relative group max-w-xl mx-auto mb-3">
      {/* Main Card Content - Clickable (Details Page) */}
      <Link href={`/prediction/${fixtureId}`}
        onClick={() => {
          // Track ViewContent on click
          if (typeof window !== 'undefined' && (window as any).fbq) {
            (window as any).fbq('track', 'ViewContent', {
              content_name: `${homeTeam.name} vs ${awayTeam.name}`,
              content_category: 'Prediction',
              content_ids: [fixtureId],
              content_type: 'product'
            });
          }
        }}
        className={`block bg-[#1F1F1F] rounded-xl shadow-sm hover:shadow-md hover:bg-[#2a2a2a] transition flex items-center justify-between p-2 sm:p-3 border-l-4 border-r border-t border-b border-r-white/5 border-t-white/5 border-b-white/5 ${isLive ? "border-l-red-500" : "border-l-transparent"} gap-2`}
      >
        {/* STATUS */}
        <div className="w-[40px] sm:w-[50px] text-left shrink-0">
          <p className={`text-[10px] sm:text-xs leading-none font-bold ${isLive ? "text-red-500 animate-pulse" : "text-gray-500"}`}>
            {status}
          </p>
        </div>

        {/* TEAMS */}
        <div className="flex flex-col items-start text-left flex-1 min-w-0 gap-1">
          <div className="flex items-center gap-1.5 w-full">
            <Link
              href={`/team/${homeTeam.id}?name=${encodeURIComponent(homeTeam.name)}&logo=${encodeURIComponent(homeTeam.logo)}`}
              onClick={(e) => e.stopPropagation()} // Prevent triggering the main card link
              className="flex items-center gap-1.5 hover:text-orange-400 transition-colors max-w-full overflow-hidden"
            >
              <Image src={homeTeam.logo} alt={homeTeam.name} width={14} height={14} className="w-3.5 h-3.5 object-contain shrink-0" unoptimized />
              <span className="font-medium text-[11px] sm:text-xs truncate">{homeTeam.name}</span>
            </Link>
          </div>
          <div className="flex items-center gap-1.5 w-full">
            <Link
              href={`/team/${awayTeam.id}?name=${encodeURIComponent(awayTeam.name)}&logo=${encodeURIComponent(awayTeam.logo)}`}
              onClick={(e) => e.stopPropagation()} // Prevent triggering the main card link
              className="flex items-center gap-1.5 hover:text-orange-400 transition-colors max-w-full overflow-hidden"
            >
              <Image src={awayTeam.logo} alt={awayTeam.name} width={14} height={14} className="w-3.5 h-3.5 object-contain shrink-0" unoptimized />
              <span className="font-medium text-[11px] sm:text-xs truncate">{awayTeam.name}</span>
            </Link>
          </div>
        </div>

        {/* ODDS / LOCKED STATE */}
        <div className={`flex flex-row justify-between w-[90px] sm:w-[130px] shrink-0 ${isLive ? "animate-pulse" : ""}`}>
          <span className={`text-[10px] sm:text-xs ${getOddsColor(odds.home, [odds.home, odds.draw, odds.away])}`}>{odds.home ?? "-"}</span>
          <span className={`text-[10px] sm:text-xs ${getOddsColor(odds.draw, [odds.home, odds.draw, odds.away])}`}>{odds.draw ?? "-"}</span>
          <span className={`text-[10px] sm:text-xs ${getOddsColor(odds.away, [odds.home, odds.draw, odds.away])}`}>{odds.away ?? "-"}</span>
        </div>

        {/* SCORE & TIP SECTION */}
        <div className="flex items-center gap-2 w-[60px] sm:w-[75px] justify-end shrink-0">

          {/* VERTICAL SCORES */}
          <div className={`flex flex-col gap-1 items-end justify-center font-bold text-[11px] sm:text-xs leading-none ${isLive ? "text-red-500" : "text-gray-200"}`}>
            {score ? (
              <>
                <span className="h-3.5 flex items-center">{score.split(" - ")[0]}</span>
                <span className="h-3.5 flex items-center">{score.split(" - ")[1]}</span>
              </>
            ) : (
              /* Empty spacer to keep alignment if needed, or just nothing as requested */
              null
            )}
          </div>

          {/* TIP - Side by side */}
          {prediction && prediction !== "N/A" && (
            <div className="flex items-center justify-center">
              <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest px-1.5 py-1 rounded bg-white/5 border border-white/10 ${tipColor}`}>
                {prediction}
              </span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
