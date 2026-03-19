"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
// import { Lock } from "lucide-react";
// import { useSession, signIn } from "next-auth/react";
// import { useState } from "react";

export interface Odds {
  home: string | null;
  draw: string | null;
  away: string | null;
  bttsYes?: string | null;
  bttsNo?: string | null;
  over15?: string | null;
  under35?: string | null;
}

export interface Team {
  id: number;
  name: string;
  logo: string;
}

export interface FixtureCardProps {
  fixtureId: number;
  status: string;
  kickoffTime?: string;
  homeTeam: Team;
  awayTeam: Team;
  odds: Odds;
  score: string | null;
  prediction?: string | null;
  liveOdds?: unknown;
}

export default function FixtureCard({
  fixtureId,
  status,
  kickoffTime,
  homeTeam,
  awayTeam,
  odds,
  score,
  prediction,
  liveOdds,
}: FixtureCardProps) {
  const router = useRouter();
  const isLive = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"].includes(status) || status.includes("'");
  const isFinished = status === "FT";

  function getOddsColor(
    value: string | null,
    allOdds: (string | null)[]
  ): string {
    if (!value) return "text-gray-400";
    const num = parseFloat(value);
    if (isNaN(num)) return "text-[#fb0]";

    // Convert all odds to numbers, ignore nulls
    const nums = allOdds.map(o => (o ? parseFloat(o) : NaN)).filter(n => !isNaN(n));
    const max = Math.max(...nums);
    const min = Math.min(...nums);

    // Check for ties
    const countMax = nums.filter(n => n === max).length;
    const countMin = nums.filter(n => n === min).length;

    if (num === min && countMin === 1) return "text-green-400"; // lowest unique → green 
    if (num === max && countMax === 1) return "text-red-400";   // highest unique → red
    return "text-[#fb0]"; // middle/tie → orange/gold
  }

  // ... (getTipStatus remains the same) ...
  function getTipStatus(tip: string, scoreString: string | null, status: string): "WIN" | "LOSS" | "PENDING" {
    if (!scoreString || status === "NS") return "PENDING";
    const parts = scoreString.split(" - ");
    if (parts.length !== 2) return "PENDING";
    const h = parseInt(parts[0]);
    const a = parseInt(parts[1]);
    const t = tip.trim().toUpperCase();
    if (t === "1") return h > a ? "WIN" : "LOSS";
    if (t === "2") return a > h ? "WIN" : "LOSS";
    if (t === "X") return h === a ? "WIN" : "LOSS";
    if (t === "1X") return h >= a ? "WIN" : "LOSS";
    if (t === "X2") return a >= h ? "WIN" : "LOSS";
    if (t === "12") return h !== a ? "WIN" : "LOSS";
    if (t.startsWith("OVER")) {
      const line = parseFloat(t.split(" ")[1]);
      if (!isNaN(line)) return (h + a) > line ? "WIN" : "LOSS";
    }
    if (t.startsWith("UNDER")) {
      const line = parseFloat(t.split(" ")[1]);
      if (!isNaN(line)) return (h + a) < line ? "WIN" : "LOSS";
    }
    return "PENDING";
  }

  const tipStatus = (prediction && prediction !== "N/A")
    ? getTipStatus(prediction, score, status)
    : "PENDING";

  let tipColor = "text-orange-300"; // Pale Orange (Pending)
  if (tipStatus === "WIN") tipColor = "text-green-500";
  if (tipStatus === "LOSS") tipColor = "text-red-500";

  // Use live odds when available, else pre-match 1X2 odds
  let effectiveOdds = odds || { home: null, draw: null, away: null };
  if (isLive && liveOdds && Array.isArray(liveOdds) && liveOdds.length > 0) {
    const market = (liveOdds[0] as { markets?: Array<{ name?: string; id?: number; values?: Array<{ value?: string; odd?: string }> }> })?.markets?.find(
      (m: { name?: string; id?: number }) => m?.name === "Match Winner" || m?.id === 1
    );
    if (market?.values) {
      const homeVal = market.values.find((v: { value?: string }) => v?.value === "Home")?.odd;
      const drawVal = market.values.find((v: { value?: string }) => v?.value === "Draw")?.odd;
      const awayVal = market.values.find((v: { value?: string }) => v?.value === "Away")?.odd;
      if (homeVal != null && awayVal != null) {
        effectiveOdds = { home: homeVal, draw: drawVal ?? null, away: awayVal };
      }
    }
  }

  return (
    <div className="relative group max-w-xl mx-auto mb-3">
      {/* Main Card Content - Clickable (Details Page) */}
      <div
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
          router.push(`/prediction/${fixtureId}`);
        }}
        className={`cursor-pointer block bg-[#1F1F1F] rounded-xl shadow-sm hover:shadow-md hover:bg-[#2a2a2a] transition flex items-center justify-between p-2 sm:p-3 border-l-4 border-r border-t border-b border-r-white/5 border-t-white/5 border-b-white/5 ${isLive ? "border-l-red-500" : "border-l-transparent"} gap-2`}
      >
        {/* STATUS */}
        <div className="w-[40px] sm:w-[50px] text-left shrink-0">
          <div className="flex flex-col leading-none">
            <p className={`text-[10px] sm:text-xs font-bold ${isLive ? "text-red-500 animate-pulse" : "text-gray-500"}`}>
              {status}
            </p>
            {isFinished && kickoffTime && (
              <p className="text-[9px] sm:text-[10px] text-gray-500 mt-1">
                {kickoffTime}
              </p>
            )}
          </div>
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
              <span className="font-medium text-[11px] sm:text-xs truncate text-white">{homeTeam.name}</span>
            </Link>
          </div>
          <div className="flex items-center gap-1.5 w-full">
            <Link
              href={`/team/${awayTeam.id}?name=${encodeURIComponent(awayTeam.name)}&logo=${encodeURIComponent(awayTeam.logo)}`}
              onClick={(e) => e.stopPropagation()} // Prevent triggering the main card link
              className="flex items-center gap-1.5 hover:text-orange-400 transition-colors max-w-full overflow-hidden"
            >
              <Image src={awayTeam.logo} alt={awayTeam.name} width={14} height={14} className="w-3.5 h-3.5 object-contain shrink-0" unoptimized />
              <span className="font-medium text-[11px] sm:text-xs truncate text-white">{awayTeam.name}</span>
            </Link>
          </div>
        </div>

        {/* 1X2 ODDS */}
        <div className={`flex flex-row justify-between w-[90px] sm:w-[130px] shrink-0 ${isLive ? "text-white" : ""}`}>
          <span className={`text-[10px] sm:text-xs font-bold leading-none ${getOddsColor(effectiveOdds?.home ?? null, [effectiveOdds?.home ?? null, effectiveOdds?.draw ?? null, effectiveOdds?.away ?? null])}`}>
            {effectiveOdds?.home ?? "-"}
          </span>
          <span className={`text-[10px] sm:text-xs font-bold leading-none ${getOddsColor(effectiveOdds?.draw ?? null, [effectiveOdds?.home ?? null, effectiveOdds?.draw ?? null, effectiveOdds?.away ?? null])}`}>
            {effectiveOdds?.draw ?? "-"}
          </span>
          <span className={`text-[10px] sm:text-xs font-bold leading-none ${getOddsColor(effectiveOdds?.away ?? null, [effectiveOdds?.home ?? null, effectiveOdds?.draw ?? null, effectiveOdds?.away ?? null])}`}>
            {effectiveOdds?.away ?? "-"}
          </span>
        </div>

        {/* SCORE & TIP */}
        <div className="flex items-center gap-2 w-[60px] sm:w-[75px] justify-end shrink-0">
          <div className={`flex flex-col gap-1 items-end justify-center font-bold text-[11px] sm:text-xs leading-none ${isLive ? "text-red-500" : "text-gray-200"}`}>
            {score ? (
              <>
                <span className="h-3.5 flex items-center">{score.split(" - ")[0]}</span>
                <span className="h-3.5 flex items-center">{score.split(" - ")[1]}</span>
              </>
            ) : null}
          </div>
          {prediction && prediction !== "N/A" && (
            <div className="flex items-center justify-center">
              <span
                className={`w-[34px] sm:w-[44px] h-[22px] sm:h-[24px] flex items-center justify-center text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded bg-white/5 border border-white/10 ${tipColor} leading-none overflow-hidden`}
              >
                {prediction}
              </span>
            </div>
          )}
        </div>
      </div >
    </div >
  );
}
