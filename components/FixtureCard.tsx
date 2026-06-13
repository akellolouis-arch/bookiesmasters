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
  const tipBgClass = isEven ? "bg-[#1E1E1E]" : "bg-[#0A0A0A]";
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
        className={`cursor-pointer block ${bgClass} hover:shadow-md ${hoverClass} transition flex flex-col p-0.5 sm:p-1 no-underline text-inherit`}
      >
        {/* TOP ROW: MATCHUP */}
        <div className="flex items-center justify-between w-full">
          {/* HOME TEAM */}
          <div className="flex items-center justify-end gap-1.5 flex-1 min-w-0">
            <span className="font-medium text-[9px] sm:text-[10px] truncate text-white text-right px-1">{homeTeam.name}</span>
            <Image src={homeTeam.logo} alt={homeTeam.name} width={16} height={16} className="w-4 h-4 object-contain shrink-0 drop-shadow-sm" unoptimized />
          </div>

          {/* CENTER BOX (Time Only) */}
          <div className="w-[50px] shrink-0 flex flex-col items-center justify-center">
             <span className="text-[9px] sm:text-[10px] font-semibold text-gray-400">
               {kickoffTime || "--:--"}
             </span>
          </div>

          {/* AWAY TEAM */}
          <div className="flex items-center justify-start gap-1.5 flex-1 min-w-0">
            <Image src={awayTeam.logo} alt={awayTeam.name} width={16} height={16} className="w-4 h-4 object-contain shrink-0 drop-shadow-sm" unoptimized />
            <span className="font-medium text-[9px] sm:text-[10px] truncate text-white text-left px-1">{awayTeam.name}</span>
          </div>
        </div>

        {/* BOTTOM ROW: STATUS / PREDICTION / SCORE STRIP */}
        <div className={`mt-0.5 w-full ${tipBgClass} border border-white/5 rounded h-[16px] flex items-center justify-between px-2 shadow-sm`}>
          {/* LEFT: STATUS */}
          <div className={`text-[9px] sm:text-[10px] font-bold uppercase w-8 text-left ${isLive ? "text-red-500 animate-pulse" : "text-gray-500"}`}>
            {status}
          </div>

          {/* MIDDLE: PREDICTION */}
          <div className="flex-1 text-center">
            {prediction ? (
              <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ${predictionColorClass}`}>
                {prediction}
              </span>
            ) : (
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-600">-</span>
            )}
          </div>

          {/* RIGHT: SCORE */}
          <div className={`text-[9px] sm:text-[10px] font-bold w-8 text-right ${isLive ? "text-red-500 animate-pulse" : "text-gray-500"}`}>
             {score ? score.replace(" - ", "-") : "-"}
          </div>
        </div>
      </Link>
    </div>
  );
}
