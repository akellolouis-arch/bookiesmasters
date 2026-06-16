import React from "react";
import Link from "next/link";
import MatchIntroduction from "@/components/fixture-details/MatchIntroduction";

interface Team {
  id: number;
  name: string;
  logo: string;
  allMatches?: any[];
}

interface FixtureTrend {
  fixtureId: number;
  leagueId: number;
  league: string;
  leagueLogo: string;
  country: string;
  date: string;
  displayDate: string;
  status: string;
  venue?: string;
  tip?: string;
  score?: { home: number | null; away: number | null } | null;
  homeTeam: Team;
  awayTeam: Team;
  h2h?: any[];
}

async function fetchTrends(): Promise<FixtureTrend[]> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    console.error("NEXT_PUBLIC_API_URL is not set");
    return [];
  }

  try {
    const res = await fetch(`${base}/api/predictions/trends`, {
      next: { revalidate: 3600 }, // Cache for 1 hour (ISR)
    });

    if (!res.ok) {
      console.error(`⚠️ Failed to fetch trends. Status: ${res.status}`);
      return [];
    }

    const json = await res.json();
    return (json.data || []) as FixtureTrend[];
  } catch (error) {
    console.error("⚠️ Error fetching trends in Server Component:", error);
    return [];
  }
}

export default async function TopTrends() {
  const trends = await fetchTrends();

  if (!trends || trends.length === 0) {
    return null;
  }

  return (
    <div className="w-full md:max-w-2xl lg:max-w-2xl mx-auto px-0 mt-2 mb-0">
      {/* Title */}
      <div className="flex items-center justify-center gap-2 mb-1.5 px-1 sm:px-0">
        <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-white/10" />
        <span className="text-[11px] font-bold text-amber-100/90 tracking-wider uppercase whitespace-nowrap">
          top trends
        </span>
        <div className="flex-1 h-[1px] bg-gradient-to-r from-white/10 to-transparent" />
      </div>

      {/* Cards List */}
      <div className="space-y-0">
        {trends.map((match) => {
          const formattedTip = match.tip || "";
          
          return (
            <div
              key={match.fixtureId}
              className="bg-[#121212] border border-white/5 rounded-none p-1.5 sm:p-2 hover:border-white/10 transition-all duration-300"
            >
              {/* League Header */}
              <div className="flex items-center gap-1 mb-1">
                {match.leagueLogo && (
                  <img
                    src={match.leagueLogo}
                    alt={match.league}
                    className="w-3.5 h-3.5 object-contain opacity-70"
                  />
                )}
                <span className="text-[8px] text-gray-500 font-medium tracking-wide uppercase">
                  {match.league} • {match.country}
                </span>
              </div>

              {/* Match Teams Header */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full mb-1 gap-1">
                {/* HOME TEAM */}
                <div className="flex items-center justify-end gap-1.5 min-w-0">
                  <span className="text-[9px] sm:text-[10px] font-semibold text-gray-200 truncate capitalize text-right">
                    {match.homeTeam.name}
                  </span>
                  {match.homeTeam.logo && (
                    <img
                      src={match.homeTeam.logo}
                      alt={match.homeTeam.name}
                      className="w-3.5 h-3.5 object-contain shrink-0"
                    />
                  )}
                </div>
                
                {/* VS */}
                <span className="text-[8px] font-bold text-gray-500 px-1 text-center min-w-[20px]">VS</span>

                {/* AWAY TEAM */}
                <div className="flex items-center justify-start gap-1.5 min-w-0">
                  {match.awayTeam.logo && (
                    <img
                      src={match.awayTeam.logo}
                      alt={match.awayTeam.name}
                      className="w-3.5 h-3.5 object-contain shrink-0"
                    />
                  )}
                  <span className="text-[9px] sm:text-[10px] font-semibold text-gray-200 truncate capitalize text-left">
                    {match.awayTeam.name}
                  </span>
                </div>
              </div>

              {/* Match Introduction Narrative (Housed in bg-white/5 block) */}
              <MatchIntroduction
                homeTeamName={match.homeTeam.name}
                awayTeamName={match.awayTeam.name}
                venue={match.venue}
                homeMatches={match.homeTeam.allMatches || []}
                awayMatches={match.awayTeam.allMatches || []}
                h2hMatches={match.h2h || []}
                status={match.status}
                score={match.score}
                computedTip={formattedTip}
                bg="bg-white/5"
                rounded="rounded-lg"
                padding="py-0.5 px-1 sm:py-1 sm:px-1.5"
                margin="mb-0 mt-0.5"
              />

              {/* View Full Analysis Link */}
              <div className="flex justify-end mt-0.5">
                <Link
                  href={`/prediction/${match.fixtureId}`}
                  className="inline-flex items-center gap-0.5 text-[8px] font-bold text-amber-100/70 hover:text-amber-100 transition-colors uppercase tracking-wider bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded-lg"
                >
                  View Details →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
