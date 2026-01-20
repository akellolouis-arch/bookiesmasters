"use client";

import useSWR from "swr";
import Image from "next/image";
import Link from "next/link";
import FixtureCard from "@/components/FixtureCard";

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
      refreshInterval: date === "live" ? 5000 : 15000, // Faster refresh for live matches (5s vs 15s)
      fallbackData: { fixtures: initialData },
      revalidateOnFocus: false,
      dedupingInterval: 1000,
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

  return (
    <div className="max-w-xl mx-auto px-1 py-2 space-y-1">
      {safeData.length === 0 && (
        <p className="text-center py-8 text-gray-500">
          No fixtures available for this date.
        </p>
      )}

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
              <FixtureCard key={fixture.fixtureId} {...fixture} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
