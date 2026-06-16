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
    <div className="w-full md:max-w-2xl lg:max-w-2xl mx-auto px-2 sm:px-1 md:px-4 mt-8 mb-8">
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-bold text-amber-100 tracking-wider uppercase">
          🔥 Top Trends & Insights
        </span>
        <div className="flex-1 h-[1px] bg-gradient-to-r from-amber-500/30 to-transparent" />
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        {trends.map((match) => {
          const formattedTip = match.tip || "";
          
          return (
            <div
              key={match.fixtureId}
              className="bg-[#121212] border border-white/5 rounded-xl p-3 sm:p-4 hover:border-white/10 transition-all duration-300"
            >
              {/* League Header */}
              <div className="flex items-center gap-1.5 mb-2.5">
                {match.leagueLogo && (
                  <img
                    src={match.leagueLogo}
                    alt={match.league}
                    className="w-3.5 h-3.5 object-contain opacity-80"
                  />
                )}
                <span className="text-[9px] text-gray-500 font-medium tracking-wide uppercase">
                  {match.league} • {match.country}
                </span>
              </div>

              {/* Match Teams Header */}
              <div className="flex items-center justify-between mb-3 bg-white/5 rounded-lg p-2">
                <div className="flex items-center gap-1.5 truncate">
                  {match.homeTeam.logo && (
                    <img
                      src={match.homeTeam.logo}
                      alt={match.homeTeam.name}
                      className="w-4 h-4 object-contain"
                    />
                  )}
                  <span className="text-[10px] sm:text-xs font-semibold text-gray-200 truncate uppercase">
                    {match.homeTeam.name}
                  </span>
                </div>
                
                <span className="text-[10px] font-bold text-gray-500 px-2">VS</span>

                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-[10px] sm:text-xs font-semibold text-gray-200 truncate uppercase">
                    {match.awayTeam.name}
                  </span>
                  {match.awayTeam.logo && (
                    <img
                      src={match.awayTeam.logo}
                      alt={match.awayTeam.name}
                      className="w-4 h-4 object-contain"
                    />
                  )}
                </div>
              </div>

              {/* Match Introduction Narrative */}
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
              />

              {/* View Full Analysis Link */}
              <div className="flex justify-end mt-2">
                <Link
                  href={`/prediction/${match.fixtureId}`}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-100/80 hover:text-amber-100 transition-colors uppercase tracking-wider bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-md"
                >
                  View Details & Stats →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
