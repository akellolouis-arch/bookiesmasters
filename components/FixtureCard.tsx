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
              } else if (prediction.includes("UN3.5") || prediction.includes("Under 3.5")) {
                  isWon = totalGoals < 3.5;
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
        className={`cursor-pointer block ${bgClass} hover:shadow-md ${hoverClass} transition flex flex-col p-1.5 sm:p-2 no-underline text-inherit`}
      >
        {/* TOP ROW: MATCHUP */}
        <div className="flex items-center justify-between w-full">
          {/* HOME TEAM */}
          <div className="flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0">
            <Image src={homeTeam.logo} alt={homeTeam.name} width={20} height={20} className="w-5 h-5 object-contain shrink-0 drop-shadow-sm" unoptimized />
            <span className="font-medium text-[9px] sm:text-[10px] truncate text-white text-center block w-full px-1">{homeTeam.name}</span>
          </div>

          {/* CENTER BOX (Time / Score) */}
          <div className="w-[70px] sm:w-[80px] shrink-0 flex flex-col items-center justify-center">
            {isLive || isFinished ? (
              <div className={`flex flex-col items-center leading-none ${isLive ? "text-red-500 animate-pulse" : "text-white"}`}>
                {/* STATUS ABOVE SCORE */}
                {isLive && status && (
                  <span className="text-[8px] text-red-500 mb-0.5 uppercase font-bold tracking-wider">{status}</span>
                )}
                {isFinished && (
                  <span className="text-[8px] text-gray-500 mb-0.5 font-bold uppercase tracking-wider">FT</span>
                )}
                
                {/* SCORE WITHOUT BORDER */}
                {score ? (
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] sm:text-[12px] font-bold">{score.split(" - ")[0]}</span>
                    <span className="text-gray-500 text-[8px] font-normal">-</span>
                    <span className="text-[11px] sm:text-[12px] font-bold">{score.split(" - ")[1]}</span>
                  </div>
                ) : (
                  <span className="text-[11px] sm:text-[12px] font-bold">-</span>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {/* TIME WITHOUT BORDER */}
                <span className="text-[9px] sm:text-[10px] font-semibold text-gray-300">
                  {kickoffTime || status}
                </span>
              </div>
            )}
          </div>

          {/* AWAY TEAM */}
          <div className="flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0">
            <Image src={awayTeam.logo} alt={awayTeam.name} width={20} height={20} className="w-5 h-5 object-contain shrink-0 drop-shadow-sm" unoptimized />
            <span className="font-medium text-[9px] sm:text-[10px] truncate text-white text-center block w-full px-1">{awayTeam.name}</span>
          </div>
        </div>

        {/* BOTTOM ROW: PREDICTION STRIP */}
        {prediction && (
          <div className="mt-2 w-full bg-black/40 border border-white/5 rounded py-1 px-3 flex justify-between items-center shadow-sm">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400">
              TIP
            </span>
            <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ${predictionColorClass}`}>
              {prediction}
            </span>
          </div>
        )}
      </Link>
    </div>
  );
}
