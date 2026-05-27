"use client";

import useSWR from "swr";
import Image from "next/image";
import FixtureCard from "@/components/FixtureCard";
import Loader from "@/components/Loader";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

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
  kickoffTime?: string;
  score: string | null;
  league: { id: number; name: string; logo: string; country: string };
  homeTeam: Team;
  awayTeam: Team;
  odds: Odds;
  prediction?: string | null;
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
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") || "").trim().toLowerCase();

  // Construct URL dynamically
  const apiUrl = date === "live"
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/fixtures/live`
    : `${process.env.NEXT_PUBLIC_API_URL}/api/fixtures/cards?date=${date}`;

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
  const isToday = date === today;

  const { data: swrData, isValidating } = useSWR(
    apiUrl,
    fetcher,
    {
      refreshInterval: (latestData) => {
        if (date === "live") return 15000;
        if (!isToday) return 0;
        
        let hasLive = false;
        const fixturesToCheck = latestData?.fixtures || initialData;
        if (Array.isArray(fixturesToCheck)) {
          hasLive = fixturesToCheck.some((f: any) => {
            const matches = f.matches || [];
            return matches.some((m: any) =>
              ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"].includes(m.status) || m.status?.includes("'")
            );
          });
        }
        return hasLive ? 15000 : 60000;
      },
      fallbackData: { fixtures: initialData },
      revalidateOnMount: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
    }
  );

  // UNWRAP LOGIC: backend returns { fixtures: [...] }
  const backendFixtures = swrData?.fixtures;

  let safeData: LeagueGroup[] = initialData;

  if (Array.isArray(backendFixtures)) {
    safeData = backendFixtures.map((f: { league?: { id: number; name: string; logo: string; country: string }; matches?: FixtureCardProps[] }) => {
      if (f.league) {
        return {
          id: f.league.id,
          name: f.league.name,
          logo: f.league.logo,
          country: f.league.country,
          matches: f.matches ?? []
        };
      }
      return f as LeagueGroup;
    });
  }

  // Filter fixtures by searched team name for the currently active date.
  if (query) {
    safeData = safeData
      .map((league) => ({
        ...league,
        matches: league.matches.filter((match: FixtureCardProps) => {
          const home = match.homeTeam?.name?.toLowerCase() || "";
          const away = match.awayTeam?.name?.toLowerCase() || "";
          return home.includes(query) || away.includes(query);
        }),
      }))
      .filter((league) => league.matches.length > 0);
  }



  // FIX: Prevent "shambolic" display on initial load by waiting for mount
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Loader />;
  }

  return (
    <div className="w-full md:max-w-2xl lg:max-w-2xl mx-auto sm:px-1 md:px-4">
      {safeData.length === 0 && (
        <p className="text-center py-8 text-gray-500">
          {query
            ? (date === "live"
              ? `No live fixture for "${query}".`
              : `No fixtures for "${query}" on this date.`)
            : (date === "live"
              ? "No live fixtures."
              : "No fixtures available for this date.")}
        </p>
      )}

      {(() => {
        let globalIdx = 0;
        return safeData.map((league, idx) => (
          <div key={league.id || idx}>
            <div className="flex items-center gap-1 bg-gradient-to-r from-emerald-900/40 to-[#121212] py-2 px-3 shadow-md border border-white/5 border-b-0">
              <div className="flex items-center gap-2 w-full">
                {league.logo && (
                  <Image
                    src={league.logo}
                    alt={league.name}
                    width={20}
                    height={20}
                    className="w-5 h-5 flex-shrink-0 drop-shadow-md"
                    unoptimized
                  />
                )}
                <div className="flex flex-col truncate w-full">
                  <span className="font-medium text-xs text-amber-100 tracking-wide truncate drop-shadow-sm">
                    {league.name}
                  </span>
                  <span className="text-[8px] text-emerald-200/70 font-semibold capitalize tracking-wider truncate">{league.country.toLowerCase()}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              {league.matches.map((fixture) => {
                const currentIdx = globalIdx++;
                return (
                  <FixtureCard key={fixture.fixtureId} {...fixture} index={currentIdx} />
                );
              })}
            </div>
          </div>
        ));
      })()}
    </div>
  );
}
