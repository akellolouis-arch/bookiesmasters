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
  index?: number;
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
  index,
}: FixtureCardProps) {
  const isLive = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"].includes(status) || status.includes("'");
  const isFinished = status === "FT";



  const href = `/prediction/${fixtureId}`;

  const isEven = index !== undefined ? index % 2 === 0 : true;
  const bgClass = isEven ? "bg-[#0A0A0A]" : "bg-[#1E1E1E]";
  const hoverClass = isEven ? "hover:bg-[#151515]" : "hover:bg-[#282828]";

  return (
    <div className="relative group w-full md:max-w-2xl lg:max-w-2xl mx-auto">
      <Link
        href={href}
        prefetch={true}
        onClick={() => {
          if (typeof window !== "undefined" && (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq) {
            (window as unknown as { fbq: (...args: unknown[]) => void }).fbq("track", "ViewContent", {
              content_name: `${homeTeam.name} vs ${awayTeam.name}`,
              content_category: "Prediction",
              content_ids: [fixtureId],
              content_type: "product",
            });
          }
        }}
        className={`cursor-pointer block ${bgClass} hover:shadow-md ${hoverClass} transition flex items-center justify-between p-2 sm:p-3 gap-2 no-underline text-inherit`}
      >
        {/* HOME TEAM (Left-aligned) */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 justify-end">
          <span className="font-normal text-[11px] sm:text-xs truncate text-white text-right block">{homeTeam.name}</span>
          <Image src={homeTeam.logo} alt={homeTeam.name} width={14} height={14} className="w-3.5 h-3.5 object-contain shrink-0" unoptimized />
        </div>

        {/* CENTER BOX (Time / Score) */}
        <div className="w-[70px] sm:w-[90px] shrink-0 flex flex-col items-center justify-center">
          {isLive || isFinished ? (
            <div className={`flex flex-col items-center font-bold text-[12px] sm:text-sm leading-none ${isLive ? "text-red-500 animate-pulse" : "text-white"}`}>
              {score ? (
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-1 rounded-md shadow-sm">
                  <span>{score.split(" - ")[0]}</span>
                  <span className="text-gray-500 text-[10px]">-</span>
                  <span>{score.split(" - ")[1]}</span>
                </div>
              ) : (
                <span>-</span>
              )}
              {isLive && status && (
                <span className="text-[9px] sm:text-[10px] text-red-500 mt-1 uppercase font-semibold">{status}</span>
              )}
              {isFinished && (
                <span className="text-[9px] sm:text-[10px] text-gray-500 mt-1 font-semibold uppercase">FT</span>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-[10px] sm:text-[11px] font-semibold text-gray-300 bg-white/5 border border-white/10 px-2 sm:px-3 py-1 rounded-md shadow-sm">
                {kickoffTime || status}
              </span>
            </div>
          )}
        </div>

        {/* AWAY TEAM (Right-aligned) */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 justify-start">
          <Image src={awayTeam.logo} alt={awayTeam.name} width={14} height={14} className="w-3.5 h-3.5 object-contain shrink-0" unoptimized />
          <span className="font-normal text-[11px] sm:text-xs truncate text-white text-left block">{awayTeam.name}</span>
        </div>
      </Link>
    </div>
  );
}
