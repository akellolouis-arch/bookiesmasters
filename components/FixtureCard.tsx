"use client";

import Image from "next/image";
import Link from "next/link";
import { PRIMARY_AFFILIATE } from "@/data/affiliates";
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
    <div className="max-w-xl mx-auto mb-3">
      <div className={`relative flex items-stretch bg-[#1F1F1F] rounded-xl shadow-sm hover:shadow-md transition border border-white/5 overflow-hidden group ${isLive ? "border-l-4 border-l-red-500" : ""}`}>

        {/* Main Clickable Content -> Details Page */}
        <Link
          href={`/prediction/${fixtureId}`}
          className="flex-1 flex items-center justify-between p-2 sm:p-3 gap-2 min-w-0"
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
              <Image src={homeTeam.logo} alt={homeTeam.name} width={14} height={14} className="w-3.5 h-3.5 object-contain shrink-0" unoptimized />
              <span className="font-medium text-gray-200 text-[11px] sm:text-xs truncate w-full">{homeTeam.name}</span>
            </div>
            <div className="flex items-center gap-1.5 w-full">
              <Image src={awayTeam.logo} alt={awayTeam.name} width={14} height={14} className="w-3.5 h-3.5 object-contain shrink-0" unoptimized />
              <span className="font-medium text-gray-200 text-[11px] sm:text-xs truncate w-full">{awayTeam.name}</span>
            </div>
          </div>

          {/* ODDS (Hidden on very small screens if needed, or kept compact) */}
          <div className={`hidden xs:flex flex-row justify-between w-[80px] shrink-0 ${isLive ? "animate-pulse" : ""}`}>
            {/* Simplified Odds Display */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-gray-500">1</span>
              <span className={`text-[10px] ${getOddsColor(odds.home, [odds.home, odds.draw, odds.away])}`}>{odds.home ?? "-"}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-gray-500">X</span>
              <span className={`text-[10px] ${getOddsColor(odds.draw, [odds.home, odds.draw, odds.away])}`}>{odds.draw ?? "-"}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-gray-500">2</span>
              <span className={`text-[10px] ${getOddsColor(odds.away, [odds.home, odds.draw, odds.away])}`}>{odds.away ?? "-"}</span>
            </div>
          </div>

          {/* SCORE / TIP */}
          <div className="flex flex-col items-end gap-1 shrink-0 w-[50px]">
            {/* Score */}
            <div className={`font-bold text-[11px] ${isLive ? "text-red-500" : "text-gray-200"}`}>
              {score || "-"}
            </div>
            {/* Wrapper for Tip */}
            {prediction && prediction !== "N/A" && (
              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/5 ${tipColor}`}>
                {prediction}
              </span>
            )}
          </div>
        </Link>

        {/* Affiliate "BET" Button (Right Side Strip) */}
        <a
          href={PRIMARY_AFFILIATE.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`shrink-0 w-[40px] sm:w-[50px] flex flex-col items-center justify-center gap-0.5 ${PRIMARY_AFFILIATE.color || "bg-blue-600"} hover:brightness-110 transition-all cursor-pointer`}
        >
          <span className="text-[8px] sm:text-[9px] font-bold text-white uppercase -rotate-90 whitespace-nowrap">
            {PRIMARY_AFFILIATE.name}
          </span>
          <span className="text-[10px] sm:text-[12px] text-white">
            ↗
          </span>
        </a>

      </div>
    </div>
  );
}
