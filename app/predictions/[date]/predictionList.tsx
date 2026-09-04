"use client";

import Image from "next/image";
import FixtureCard from "@/components/FixtureCard";
import Loader from "@/components/Loader";
import Footer from "@/components/Footer";
import DateNavigator from "@/components/DateNavigator";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";

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

interface PredictionsListProps {
  initialData: LeagueGroup[];
  initialDate: string;
  children?: React.ReactNode;
}

export default function PredictionsList({
  initialData = [],
  initialDate,
  children,
}: PredictionsListProps) {
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") || "").trim().toLowerCase();

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [fixtures, setFixtures] = useState<LeagueGroup[]>(initialData);
  const [isFetching, setIsFetching] = useState(false);
  const isFirstRender = useRef(true);

  // Sync back/forward browser navigation buttons
  useEffect(() => {
    const handlePopState = () => {
      const parts = window.location.pathname.split("/");
      const dateFromPath = parts[parts.length - 1];
      if (dateFromPath && dateFromPath.match(/^\d{4}-\d{2}-\d{2}$/)) {
        setSelectedDate(dateFromPath);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Fetch prediction cards on date change without full page reloads
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (initialData.length > 0) {
        return;
      }
    }

    async function fetchPredictions() {
      setIsFetching(true);
      try {
        let apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/predictions/cards?date=${selectedDate}`;
        if (selectedDate === "live") {
          apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/fixtures/live`;
        }

        const res = await fetch(apiUrl);
        const data = await res.json();
        const rawFixtures = data?.fixtures || [];

        if (Array.isArray(rawFixtures)) {
          const mapped: LeagueGroup[] = rawFixtures
            .map((f: any) => {
              if (f.league) {
                return {
                  id: f.league.id,
                  name: f.league.name,
                  logo: f.league.logo,
                  country: f.league.country,
                  matches: f.matches ?? [],
                };
              }
              return f as LeagueGroup;
            })
            .filter((league: LeagueGroup) => league.matches && league.matches.length > 0);

          setFixtures(mapped);
        }
      } catch (err) {
        console.error("⚠️ Error fetching predictions for date:", selectedDate, err);
      } finally {
        setIsFetching(false);
      }
    }

    fetchPredictions();
  }, [selectedDate]);

  // Filter fixtures by searched team name
  let safeData: LeagueGroup[] = fixtures;
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

  return (
    <div className="w-full">
      {/* Date Navigator Bar */}
      <DateNavigator date={selectedDate} onDateSelect={(newDate) => setSelectedDate(newDate)} />

      {/* Main Predictions Layout Container */}
      <div className="w-full md:max-w-2xl lg:max-w-2xl mx-auto sm:px-1 md:px-4 min-h-[50vh]">
        {/* Smooth Fade & Pop Predictions Container */}
        <div className={`transition-opacity duration-200 ${isFetching ? "opacity-35 pointer-events-none" : "opacity-100"}`}>
          {(!safeData || safeData.length === 0) ? (
            !query ? (
              <div className="bg-white rounded-none p-8 text-center border border-gray-200 space-y-2 mt-2 min-h-[220px] flex flex-col justify-center items-center">
                <div className="text-gray-400 flex justify-center">
                  <Calendar size={28} />
                </div>
                <p className="text-gray-600 text-sm font-medium">No predictions found for this date.</p>
                <p className="text-gray-500 text-xs max-w-md">Our algorithm only predicts when data confidence is exceptionally high. Check back tomorrow!</p>
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">
                {selectedDate === "live"
                  ? `No live fixture for "${query}".`
                  : `No fixtures for "${query}" on this date.`}
              </p>
            )
          ) : (
            (() => {
              let globalIdx = 0;
              return safeData.map((league, idx) => (
                <div key={league.id || idx}>
                  <div className="flex items-center gap-1 bg-gray-100 py-0.5 px-0.5 shadow-md border border-gray-200 border-b-0">
                    <div className="flex items-center gap-1 w-full">
                      {league.logo && (
                        <Image
                          src={league.logo}
                          alt={league.name}
                          width={16}
                          height={16}
                          className="w-4 h-4 flex-shrink-0 drop-shadow-md"
                          unoptimized
                        />
                      )}
                      <div className="flex flex-col truncate w-full leading-tight">
                        <span className="font-medium text-[11px] text-teal-700 tracking-wide truncate drop-shadow-sm">
                          {league.name}
                        </span>
                        <span className="text-[9px] text-gray-600 font-normal capitalize tracking-wider truncate">
                          {league.country.toLowerCase()}
                        </span>
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
            })()
          )}
        </div>

        {/* Top Trends & Footer rendered in exact flow container */}
        {children}
        <Footer />
      </div>
    </div>
  );
}
