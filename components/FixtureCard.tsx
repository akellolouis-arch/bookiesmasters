"use client";

import Image from "next/image";
import Link from "next/link";
// import { Lock } from "lucide-react";
// import { useSession, signIn } from "next-auth/react";
// import { useState } from "react";


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
  score: string | null;
  index?: number;
  prediction?: string | null;
}

export default function FixtureCard({
  fixtureId,
  status,
  kickoffTime,
  homeTeam,
  awayTeam,
  score,
  index,
  prediction,
}: FixtureCardProps) {
  const isLive = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"].includes(status) || status.includes("'");
  const isFinished = status === "FT" || status === "AET" || status === "PEN";

  let predictionColorClass = "text-teal-400";
  if (prediction) {
      if (!isFinished && !isLive) {
          predictionColorClass = "text-orange-300";
      } else if (isFinished && score) {
          const parts = score.split("-").map(s => parseInt(s.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
              const totalGoals = parts[0] + parts[1];
              let isWon = false;
              let isValidTip = false;
              if (prediction.includes("OV1.5") || prediction.includes("Over 1.5")) {
                  isWon = totalGoals > 1.5;
                  isValidTip = true;
              } else if (prediction === "BTTS" || prediction.includes("GG")) {
                  isWon = parts[0] > 0 && parts[1] > 0;
                  isValidTip = true;
              } else if (prediction.includes("OV2.5") || prediction.includes("Over 2.5")) {
                  isWon = totalGoals > 2.5;
                  isValidTip = true;
              } else if (prediction.includes("UN2.5") || prediction.includes("Under 2.5")) {
                  isWon = totalGoals < 2.5;
                  isValidTip = true;
              } else if (prediction.includes("UN3.5") || prediction.includes("Under 3.5")) {
                  isWon = totalGoals < 3.5;
                  isValidTip = true;
              } else if (prediction === "1" || prediction === "HOME WIN") {
                  isWon = parts[0] > parts[1];
                  isValidTip = true;
              } else if (prediction === "2" || prediction === "AWAY WIN") {
                  isWon = parts[1] > parts[0];
                  isValidTip = true;
              }
              
              if (isValidTip) {
                  predictionColorClass = isWon ? "text-[#22c55e]" : "text-[#ef4444]";
              }
          }
      }
  }



  const href = `/prediction/${fixtureId}`;

  const isEven = index !== undefined ? index % 2 === 0 : true;
  const bgClass = isEven ? "bg-[#0A0A0A]" : "bg-[#1E1E1E]";
  const tipBgClass = isEven ? "bg-[#1E1E1E]" : "bg-[#0A0A0A]";
  const hoverClass = isEven ? "hover:bg-[#151515]" : "hover:bg-[#282828]";

  return (
    <div className="relative group w-full md:max-w-2xl lg:max-w-2xl mx-auto mb-1">
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
        className="cursor-pointer block bg-[#121212] border border-white/5 rounded-none p-1.5 sm:p-2 hover:border-white/10 transition-all duration-300 flex flex-col no-underline text-inherit"
      >
        {/* Matchup Header (Slick TopTrends style) */}
        <div className="flex items-center justify-between mb-1.5 bg-white/5 rounded-none p-1 sm:p-1.5">
          {/* HOME TEAM */}
          <div className="flex items-center justify-start gap-1.5 flex-1 min-w-0">
            <Image src={homeTeam.logo} alt={homeTeam.name} width={14} height={14} className="w-3.5 h-3.5 object-contain shrink-0" unoptimized />
            <span className="font-semibold text-[11px] sm:text-[12px] truncate text-gray-200 capitalize">{homeTeam.name}</span>
          </div>

          {/* KICKOFF / VS CENTER BOX */}
          <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 px-2 shrink-0">
            {kickoffTime || "VS"}
          </span>

          {/* AWAY TEAM */}
          <div className="flex items-center justify-end gap-1.5 flex-1 min-w-0">
            <span className="font-semibold text-[11px] sm:text-[12px] truncate text-gray-200 text-right capitalize">{awayTeam.name}</span>
            <Image src={awayTeam.logo} alt={awayTeam.name} width={14} height={14} className="w-3.5 h-3.5 object-contain shrink-0" unoptimized />
          </div>
        </div>

        {/* BOTTOM STRIP (Flat & Flush) */}
        <div className="w-full flex items-center justify-between px-1.5 py-0 mt-0">
          {/* LEFT: STATUS */}
          <div className={`text-[9px] sm:text-[10px] font-bold uppercase w-24 text-left leading-none ${isLive ? "text-red-500 animate-pulse" : "text-gray-500"}`}>
            {status}
          </div>

          {/* MIDDLE: SCORE */}
          <div className={`flex-1 text-center text-[9px] sm:text-[10px] font-bold leading-none ${isLive ? "text-red-500 animate-pulse" : "text-gray-500"}`}>
            {score ? score.replace(" - ", "-") : "-"}
          </div>

          {/* RIGHT: PREDICTION */}
          <div className="w-24 text-right leading-none">
            {prediction ? (
              <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest leading-none ${predictionColorClass}`}>
                {prediction}
              </span>
            ) : (
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest leading-none text-gray-600">-</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
