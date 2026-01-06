"use client";

import Image from "next/image";
import Link from "next/link";
import { Lock } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";

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
  prediction?: string | null;
  customOdds?: string | null;
}

export default function FixtureCard({
  fixtureId,
  status,
  homeTeam,
  awayTeam,
  odds,
  score,
  isVip = false,
  creditCost = 0,
  prediction,
  customOdds
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
  // VIP LOGIC
  // -------------------------


  // We need to check if user has unlocked this tip.
  // We can use useSession() here.
  // We can use useSession() here.
  const { data: session, update } = useSession();
  // @ts-ignore
  const unlockedTips = session?.user?.unlockedTips || [];
  // @ts-ignore
  const userCredits = session?.user?.credits || 0;

  const [unlocking, setUnlocking] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);

  const isUnlocked = !isVip || justUnlocked || unlockedTips.includes(String(fixtureId));

  const handleUnlock = async (e: React.MouseEvent) => {
    e.preventDefault(); // prevent navigation
    if (!session) {
      // route to login
      window.location.href = "/login";
      return;
    }

    if (userCredits < creditCost) {
      alert("Insufficient credits! Please top up.");
      return;
    }

    if (!confirm(`Unlock this tip for ${creditCost} Credits?`)) return;

    setUnlocking(true);
    try {
      const res = await fetch("/api/tips/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixtureId }),
      });
      const data = await res.json();
      if (data.success) {
        // Update session in background to refresh balance
        await update();
        // Instantly reveal tip
        setJustUnlocked(true);
      } else {
        alert(data.error || "Failed to unlock");
      }
    } catch (err) {
      alert("Error unlocking tip");
    } finally {
      setUnlocking(false);
    }
  };


  return (
    <div className="relative group max-w-xl mx-auto mb-3">
      {/* Main Card Content - Clickable (Details Page) */}
      <Link href={`/prediction/${fixtureId}`}
        className={`block bg-[#1F1F1F] rounded-t-xl ${isVip ? 'rounded-b-none' : 'rounded-b-xl'} shadow-sm hover:shadow-md hover:bg-[#2a2a2a] transition flex items-center justify-evenly p-3 border-l-4 border-r border-t border-b border-r-white/5 border-t-white/5 border-b-white/5 ${isLive ? "border-l-red-500" : "border-l-transparent"}`}
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

        {/* SCORE */}
        <div className={`text-right font-bold text-xs flex flex-col justify-center items-center w-[35px] sm:w-[45px] gap-1 ${isLive ? "text-red-500" : "text-gray-200"}`}>
          {score ? (
            <>
              <span>{score.split(" - ")[0]}</span>
              <span>{score.split(" - ")[1]}</span>
            </>
          ) : null}
        </div>
      </Link>

      {/* VIP FOOTER: LOCKED */}
      {!isUnlocked && isVip && (
        <div className="w-full bg-[#181818] border border-t-0 border-yellow-500/20 rounded-b-xl p-2 flex items-center justify-between px-4 animate-in fade-in">
          <div className="flex items-center gap-2 text-yellow-500">
            <Lock className="w-4 h-4" />
            <span className="text-xs font-bold">VIP Tip</span>
          </div>

          <button
            onClick={handleUnlock}
            disabled={unlocking}
            className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded transition flex items-center gap-2"
          >
            {unlocking ? "Unlocking..." : `unlock ${customOdds || '2.00'} odds for ${creditCost}credits`}
          </button>
        </div>
      )}

      {/* VIP FOOTER: UNLOCKED (SHOW PREDICTION) */}
      {isUnlocked && isVip && (
        <div className="w-full bg-green-900/20 border border-t-0 border-green-500/30 rounded-b-xl p-2 flex items-center justify-between px-4 animate-in fade-in">
          <div className="flex items-center gap-2 text-green-400">
            <span className="text-xs font-bold">Odds: {customOdds || '2.00'}</span>
          </div>

          <div className="text-green-400 font-bold text-xs flex items-center gap-2">
            Prediction: {prediction || "Available in Details"}
          </div>
        </div>
      )}
    </div>
  );
}
