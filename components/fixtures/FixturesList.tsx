"use client";

import Image from "next/image";
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

export interface MatchItem {
  fixtureId: number;
  status: any;
  kickoffTime?: string;
  score: string | null;
  homeTeam: Team;
  awayTeam: Team;
  fixture?: any;
}

export interface LeagueGroup {
  id: number;
  name: string;
  logo: string;
  country: string;
  matches: MatchItem[];
}

interface FixturesListProps {
  initialData: LeagueGroup[];
  initialDate: string;
  children?: React.ReactNode;
}

export default function FixturesList({
  initialData = [],
  initialDate,
  children,
}: FixturesListProps) {
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") || "").trim().toLowerCase();

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [fixtures, setFixtures] = useState<LeagueGroup[]>(initialData);
  const [isFetching, setIsFetching] = useState(false);
  const isFirstRender = useRef(true);

  // Sync browser back/forward buttons
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

  // Fetch all fixtures on date change without full page reloads
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (initialData.length > 0) {
        return;
      }
    }

    async function fetchFixtures() {
      setIsFetching(true);
      try {
        let apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/fixtures/cards?date=${selectedDate}`;
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
        console.error("⚠️ Error fetching fixtures for date:", selectedDate, err);
      } finally {
        setIsFetching(false);
      }
    }

    fetchFixtures();
  }, [selectedDate]);

  // Filter fixtures by searched team name
  let safeData: LeagueGroup[] = fixtures;
  if (query) {
    safeData = safeData
      .map((league) => ({
        ...league,
        matches: league.matches.filter((match) => {
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

      {/* Main Layout Container */}
      <div className="w-full md:max-w-2xl lg:max-w-2xl mx-auto sm:px-1 md:px-4 min-h-[50vh]">
        <div className={`transition-opacity duration-200 ${isFetching ? "opacity-35 pointer-events-none" : "opacity-100"}`}>
          {(!safeData || safeData.length === 0) ? (
            !query ? (
              <div className="bg-white rounded-none p-8 text-center border border-gray-200 space-y-2 mt-2 min-h-[220px] flex flex-col justify-center items-center">
                <div className="text-gray-400 flex justify-center">
                  <Calendar size={28} />
                </div>
                <p className="text-gray-600 text-sm font-medium">No fixtures found for this date.</p>
                <p className="text-gray-500 text-xs max-w-md">Check another date using the navigator above.</p>
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">
                No fixtures found for "{query}".
              </p>
            )
          ) : (
            safeData.map((league, idx) => (
              <div key={league.id || idx}>
                {/* League Header */}
                <div className="flex items-center gap-1 bg-gray-100 py-0.5 px-0.5 shadow-md border border-gray-200 border-b-0 mt-2">
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

                {/* Match Cards List (Without Prediction Badges) */}
                <div className="flex flex-col">
                  {league.matches.map((match) => {
                    const home = match.homeTeam;
                    const away = match.awayTeam;
                    const statusObj = match.fixture?.fixture?.status || match.status;
                    const rawStatus = typeof statusObj === "string" ? statusObj : (statusObj?.short || "NS");
                    const elapsed = typeof statusObj === "object" ? statusObj?.elapsed : null;
                    const isLive = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"].includes(rawStatus) || (typeof rawStatus === "string" && rawStatus.includes("'"));

                    const displayStatus = (["1H", "2H", "ET", "LIVE", "INT"].includes(rawStatus) && elapsed !== null && elapsed !== undefined && elapsed > 0)
                      ? `${elapsed}'`
                      : rawStatus;

                    const scoreStr = match.score ? match.score.replace(" - ", "-") : "-";

                    return (
                      <div
                        key={match.fixtureId}
                        className="block bg-white border border-gray-200 rounded-none py-1 px-1.5 sm:py-1.5 sm:px-2 hover:border-gray-300 transition-all duration-300 flex flex-col text-inherit"
                      >
                        {/* Matchup Header */}
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full mb-1 gap-1">
                          {/* HOME TEAM */}
                          <div className="flex items-center justify-end gap-1.5 min-w-0">
                            <span className="font-medium text-[11px] sm:text-[12px] truncate text-gray-800 capitalize text-right">
                              {home?.name}
                            </span>
                            {home?.logo && (
                              <Image
                                src={home.logo}
                                alt={home?.name || ""}
                                width={14}
                                height={14}
                                className="w-3.5 h-3.5 object-contain shrink-0"
                                unoptimized
                              />
                            )}
                          </div>

                          {/* KICKOFF / VS CENTER BOX */}
                          <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 px-2 shrink-0 text-center min-w-[32px]">
                            {match.kickoffTime || "VS"}
                          </span>

                          {/* AWAY TEAM */}
                          <div className="flex items-center justify-start gap-1.5 min-w-0">
                            {away?.logo && (
                              <Image
                                src={away.logo}
                                alt={away?.name || ""}
                                width={14}
                                height={14}
                                className="w-3.5 h-3.5 object-contain shrink-0"
                                unoptimized
                              />
                            )}
                            <span className="font-medium text-[11px] sm:text-[12px] truncate text-gray-800 capitalize text-left">
                              {away?.name}
                            </span>
                          </div>
                        </div>

                        {/* BOTTOM STRIP (Status & Score Only, No Predictions) */}
                        <div className="w-full flex items-center justify-between mt-1">
                          {/* LEFT: STATUS CONTAINER */}
                          <div className="flex-1 flex justify-start">
                            <div
                              className={`px-2 py-0.5 bg-gray-100 rounded-lg text-[10px] font-bold uppercase leading-none tracking-widest ${
                                isLive ? "text-red-500 animate-pulse" : "text-gray-500"
                              }`}
                            >
                              {displayStatus}
                            </div>
                          </div>

                          {/* MIDDLE: SCORE CONTAINER */}
                          <div className="flex shrink-0 justify-center px-2">
                            <div
                              className={`px-2 py-0.5 bg-gray-100 rounded-lg text-[10px] font-bold leading-none tracking-widest ${
                                isLive ? "text-red-500 animate-pulse" : "text-gray-500"
                              }`}
                            >
                              {scoreStr}
                            </div>
                          </div>

                          {/* RIGHT: EMPTY SPACER (No Prediction) */}
                          <div className="flex-1 flex justify-end" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {children}
      </div>

      <Footer />
    </div>
  );
}
