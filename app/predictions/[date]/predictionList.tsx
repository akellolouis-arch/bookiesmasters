"use client";

import useSWR from "swr";
import Image from "next/image";
import Link from "next/link";
import FixtureCard from "@/components/FixtureCard";
import Loader from "@/components/Loader";
import { useState, useEffect } from "react";

// ------------------------------
// TYPES BASED ON YOUR BACKEND RESPONSE
// ------------------------------
export interface Team {
  id: number;
  name: string;
  logo: string;
}

export interface Odds {
  home: string | null;
  draw: string | null;
  away: string | null;
  bttsYes?: string | null;
  bttsNo?: string | null;
  over15?: string | null;
  under35?: string | null;
}

export interface FixtureCardProps {
  fixtureId: number;
  status: string;
  score: string | null;
  league: {
    id: number;
    name: string;
    logo: string;
    country: string;
  };
  homeTeam: Team;
  awayTeam: Team;
  odds: Odds;
  prediction?: string | null;
  predictionProbability?: number | null;
  markets?: {
    oneXtwo?: { home: number; draw: number; away: number } | null;
    over15?: { pick: string; probability: number } | null;
    under35?: { pick: string; probability: number } | null;
    btts?: { pick: string; probability: number } | null;
    bestPick?: { market: string; pick: string; probability: number } | null;
  } | null;
}

export interface LeagueGroup {
  id: number;
  name: string;
  logo: string;
  country: string;
  matches: FixtureCardProps[];
}

// ------------------------------
// SWR FETCHER
// ------------------------------
// ------------------------------
// SWR FETCHER
// ------------------------------
const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then((res) => res.json());

// ------------------------------
// COMPONENT PROPS
// ------------------------------
interface PredictionsListProps {
  initialData: LeagueGroup[];
  date: string;
}

// ------------------------------
// MAIN COMPONENT
// ------------------------------
export default function PredictionsList({
  initialData,
  date,
}: PredictionsListProps) {

  // Construct URL dynamically
  const apiUrl = date === "live"
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/fixtures/live`
    : `${process.env.NEXT_PUBLIC_API_URL}/api/fixtures/cards?date=${date}`;

  const { data, isValidating } = useSWR(
    apiUrl,
    fetcher,
    {
      refreshInterval: 0, // DISABLED polling to save resources
      fallbackData: { fixtures: initialData },
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );

  // UNWRAP LOGIC: backend returns { fixtures: [...] }
  // The backend fixtures have a NESTED league object: { league: { id, name... }, matches: [] }
  // But our component expects FLATTENED objects: { id, name, matches... }
  // We must transform the SWR data to match initialData's shape.

  const backendFixtures = data?.fixtures;

  let safeData: LeagueGroup[] = initialData;

  if (Array.isArray(backendFixtures)) {
    // Transform raw API response to match component state
    safeData = backendFixtures.map((f: any) => {
      // Case 1: API Data (Nested: f.league.name)
      if (f.league) {
        return {
          id: f.league.id,
          name: f.league.name,
          logo: f.league.logo,
          country: f.league.country,
          matches: f.matches
        };
      }
      // Case 2: Fallback/Initial Data (Already Flattened: f.name)
      return f;
    });
  }

  // TAB STATE
  const [activeTab, setActiveTab] = useState<"1X2" | "BTTS" | "OV15" | "UN35">("1X2");

  // Thresholds per market (tune later)
  const thresholds = {
    "1X2": 0.55,
    "BTTS": 0.6,
    "OV15": 0.65,
    "UN35": 0.75,
  } as const;

  // Filter by active tab using model probabilities; keep odds for display.
  safeData = safeData
    .map((league) => {
      const filteredMatches = league.matches.filter((match) => {
        const markets = (match as any).markets;
        if (!markets) return false;

        if (activeTab === "BTTS") {
          const p = markets.btts?.probability;
          return typeof p === "number" && p >= thresholds.BTTS;
        }

        if (activeTab === "OV15") {
          const p = markets.over15?.probability;
          return typeof p === "number" && p >= thresholds.OV15;
        }

        if (activeTab === "UN35") {
          const p = markets.under35?.probability;
          return typeof p === "number" && p >= thresholds.UN35;
        }

        // 1X2
        const oneXtwo = markets.oneXtwo;
        if (!oneXtwo) return false;
        const maxProb = Math.max(oneXtwo.home ?? 0, oneXtwo.draw ?? 0, oneXtwo.away ?? 0);
        return maxProb >= thresholds["1X2"];
      });

      return { ...league, matches: filteredMatches };
    })
    .filter((league) => league.matches.length > 0);

  // FIX: Prevent "shambolic" display on initial load by waiting for mount
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Loader />;
  }

  return (
    <div className="max-w-xl mx-auto px-1 py-2 space-y-1">
      {safeData.length === 0 && (
        <p className="text-center py-8 text-gray-500">
          No fixtures available for this date.
        </p>
      )}

      {/* Tabs */}
      <div className="flex justify-center gap-2 mb-3">
        {(["1X2", "BTTS", "OV15", "UN35"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 text-xs font-semibold rounded-full border ${
              activeTab === tab
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-transparent text-gray-300 border-white/10"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {safeData.map((league, idx) => (
        <div key={league.id || idx}>
          <div className="flex items-center gap-1 mb-1">
            <Link
              href={`/league/${league.id}?name=${encodeURIComponent(league.name)}&logo=${encodeURIComponent(league.logo)}`}
              className="flex items-center gap-1 hover:bg-white/5 p-1 rounded transition cursor-pointer"
            >
              {league.logo && (
                <Image
                  src={league.logo}
                  alt={league.name}
                  width={20}
                  height={20}
                  className="w-5 h-5"
                  unoptimized
                />
              )}
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-gray-300 hover:text-orange-400 transition-colors">
                  {league.name} ›
                </span>
                <span className="text-xs text-gray-400">{league.country}</span>
              </div>
            </Link>
          </div>

          <div className="space-y-1">
            {league.matches.map((fixture) => (
              <FixtureCard key={fixture.fixtureId} activeTab={activeTab} {...(fixture as any)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
