"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Lock, Crown, Calendar } from "lucide-react";
import PaystackCheckout from "@/components/PaystackCheckout";
import Loader from "@/components/Loader";
import Footer from "@/components/Footer";

const KENYA_TZ = "Africa/Nairobi";

const kenyaYmdFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: KENYA_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function buildKenyaDateStrip(): Date[] {
  const todayYmd = kenyaYmdFormatter.format(new Date());
  const [y0, m0, d0] = todayYmd.split("-").map(Number);
  const out: Date[] = [];
  for (let i = -5; i <= 1; i++) {
    const ms = Date.UTC(y0, m0 - 1, d0 + i);
    out.push(new Date(ms));
  }
  return out;
}

function toYYYYMMDDUtc(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatKickoffTime(dateIso?: string): string {
  if (!dateIso) return "VS";
  try {
    const d = new Date(dateIso);
    return d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: KENYA_TZ,
    });
  } catch {
    return "VS";
  }
}

interface VipPredictionsViewProps {
  isVip: boolean;
  initialFixtures?: any[];
  initialDate?: string;
  children?: React.ReactNode;
}

export default function VipPredictionsView({
  isVip,
  initialFixtures = [],
  initialDate,
  children,
}: VipPredictionsViewProps) {
  const [dates] = useState(() => buildKenyaDateStrip());
  const todayYmd = initialDate || kenyaYmdFormatter.format(new Date());

  const [selectedDate, setSelectedDate] = useState(todayYmd);
  const [fixtures, setFixtures] = useState<any[]>(initialFixtures);
  const [isFetching, setIsFetching] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const isFirstRender = useRef(true);

  // Tomorrow YMD calculation
  const tomorrowObj = new Date(new Date().getTime() + 86400000);
  const tomorrowYmd = kenyaYmdFormatter.format(tomorrowObj);

  const isTodayOrTomorrow = selectedDate === todayYmd || selectedDate === tomorrowYmd;
  const isLocked = isTodayOrTomorrow && !isVip;

  useEffect(() => {
    // Skip fetching on initial mount if server provided initialFixtures
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (initialFixtures.length > 0) {
        return;
      }
    }

    async function fetchVipFixtures() {
      setIsFetching(true);
      try {
        const res = await fetch(`/api/vip/predictions?date=${selectedDate}`);
        const data = await res.json();
        if (data.fixtures) {
          setFixtures(data.fixtures);
        }
      } catch (err) {
        console.error("Failed to fetch VIP predictions:", err);
      } finally {
        setIsFetching(false);
      }
    }
    fetchVipFixtures();
  }, [selectedDate]);

  const getPredictionResultStatus = (fx: any): "won" | "lost" | "pending" => {
    if (fx.customResult && ["won", "lost", "pending"].includes(fx.customResult)) {
      return fx.customResult as "won" | "lost" | "pending";
    }

    const rawStatus = fx.fixture?.fixture?.status?.short || "NS";
    const isFinished = rawStatus === "FT" || rawStatus === "AET" || rawStatus === "PEN";
    const goalsHome = fx.fixture?.goals?.home;
    const goalsAway = fx.fixture?.goals?.away;
    const tip = fx.customPredictionTip || fx.predictionTip || "OV1.5";

    if (isFinished && goalsHome !== null && goalsHome !== undefined && goalsAway !== null && goalsAway !== undefined) {
      const home = Number(goalsHome);
      const away = Number(goalsAway);
      const totalGoals = home + away;
      const cleanTip = (tip || "").toUpperCase();

      let isWon = false;
      let isValidTip = false;

      if (cleanTip.includes("OV1.5") || cleanTip.includes("OVER 1.5")) {
        isWon = totalGoals > 1.5;
        isValidTip = true;
      } else if (cleanTip === "BTTS" || cleanTip.includes("GG")) {
        isWon = home > 0 && away > 0;
        isValidTip = true;
      } else if (cleanTip.includes("OV2.5") || cleanTip.includes("OVER 2.5")) {
        isWon = totalGoals > 2.5;
        isValidTip = true;
      } else if (cleanTip.includes("UN2.5") || cleanTip.includes("UNDER 2.5")) {
        isWon = totalGoals < 2.5;
        isValidTip = true;
      } else if (cleanTip.includes("UN3.5") || cleanTip.includes("UNDER 3.5")) {
        isWon = totalGoals < 3.5;
        isValidTip = true;
      } else if (cleanTip === "1" || cleanTip === "HOME WIN") {
        isWon = home > away;
        isValidTip = true;
      } else if (cleanTip === "2" || cleanTip === "AWAY WIN") {
        isWon = away > home;
        isValidTip = true;
      }

      if (isValidTip) {
        return isWon ? "won" : "lost";
      }
    }

    return "pending";
  };

  // Group fixtures by league (exact homepage structure)
  const groupedByLeague: Record<string, { id: number; name: string; logo: string; country: string; matches: any[] }> = {};
  fixtures.forEach((fx) => {
    const league = fx.fixture?.league || {};
    const leagueId = league.id || 0;
    const key = `${leagueId}_${league.name || "Other"}`;
    if (!groupedByLeague[key]) {
      groupedByLeague[key] = {
        id: leagueId,
        name: league.name || "Other League",
        logo: league.logo || league.flag || "",
        country: league.country || "World",
        matches: [],
      };
    }
    groupedByLeague[key].matches.push(fx);
  });

  return (
    <div className="w-full">
      {/* Date Navigator Bar - Flush with zero top/bottom margin */}
      <div className="max-w-[100vw] bg-gray-50 border-b border-gray-200 mx-auto">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex items-stretch w-full h-8 overflow-hidden bg-gray-50 divide-x divide-white/5 shadow-xs">
            <div className="flex-1 min-w-0 overflow-x-auto flex items-stretch scrollbar-hide no-scrollbar divide-x divide-white/5">
              {dates.map((d, i) => {
                const dateStr = toYYYYMMDDUtc(d);
                const isActive = dateStr === selectedDate;
                const dayName = d.toLocaleDateString("en-GB", {
                  weekday: "short",
                  timeZone: KENYA_TZ,
                });
                const dateDisplay = d.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  timeZone: KENYA_TZ,
                });

                return (
                  <button
                    type="button"
                    key={`${dateStr}-${i}`}
                    onClick={() => setSelectedDate(dateStr)}
                    data-active={isActive}
                    className={`flex-1 flex flex-col items-center justify-center min-w-[40px] transition-all ${
                      isActive
                        ? "bg-gray-300 text-teal-700 shadow-inner"
                        : "text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase leading-tight">{dayName}</span>
                    <span className="text-[10px] font-bold leading-tight opacity-90">{dateDisplay}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Fixtures Container (exact homepage structure) */}
      <div className="w-full md:max-w-2xl lg:max-w-2xl mx-auto sm:px-1 md:px-4 min-h-[50vh]">
        {/* Seamless Predictions Container - Preserves height during date shifts */}
        <div className={`transition-opacity duration-200 ${isFetching ? "opacity-35 pointer-events-none" : "opacity-100"}`}>
          {Object.keys(groupedByLeague).length === 0 ? (
            <div className="bg-white rounded-none p-8 text-center border border-gray-200 space-y-2 mt-2 min-h-[220px] flex flex-col justify-center items-center">
              <div className="text-gray-400 flex justify-center">
                <Calendar size={28} />
              </div>
              <p className="text-gray-600 text-sm font-medium">No VIP predictions available for this date.</p>
              <p className="text-gray-500 text-xs">Our team adds high-confidence VIP picks daily. Select another date above!</p>
            </div>
          ) : (
            Object.entries(groupedByLeague).map(([key, group]) => (
              <div key={key}>
                {/* Homepage League Header */}
                <div className="flex items-center gap-1 bg-gray-100 py-0.5 px-0.5 shadow-md border border-gray-200 border-b-0">
                  <div className="flex items-center gap-1 w-full">
                    {group.logo && (
                      <Image
                        src={group.logo}
                        alt={group.name}
                        width={16}
                        height={16}
                        className="w-4 h-4 flex-shrink-0 drop-shadow-md object-contain"
                        unoptimized
                      />
                    )}
                    <div className="flex flex-col truncate w-full leading-tight">
                      <span className="font-medium text-[11px] text-teal-700 tracking-wide truncate drop-shadow-sm">
                        {group.name}
                      </span>
                      <span className="text-[9px] text-gray-600 font-normal capitalize tracking-wider truncate">
                        {group.country.toLowerCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Homepage Match Cards */}
                <div className="flex flex-col">
                  {group.matches.map((fx) => {
                    const home = fx.fixture?.teams?.home;
                    const away = fx.fixture?.teams?.away;
                    const status = fx.fixture?.fixture?.status?.short || "NS";
                    const kickoffTime = formatKickoffTime(fx.fixture?.fixture?.date);
                    const score = fx.fixture?.goals?.home !== null && fx.fixture?.goals?.away !== null
                      ? `${fx.fixture.goals.home}-${fx.fixture.goals.away}`
                      : "-";
                    const tip = fx.customPredictionTip || fx.predictionTip || "OV1.5";
                    const odds = fx.customOdds || "1.85";

                    const resStatus = getPredictionResultStatus(fx);
                    let predictionColorClass = "text-orange-300";
                    if (resStatus === "won") {
                      predictionColorClass = "text-[#22c55e]";
                    } else if (resStatus === "lost") {
                      predictionColorClass = "text-[#ef4444]";
                    }

                    return (
                      <div
                        key={fx.fixtureId}
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
                            {kickoffTime}
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

                        {/* BOTTOM STRIP */}
                        <div className="w-full flex items-center justify-between mt-1">
                          {/* LEFT: STATUS CONTAINER */}
                          <div className="flex-1 flex justify-start">
                            <div className="px-2 py-0.5 bg-gray-100 rounded-lg text-[10px] font-bold uppercase leading-none tracking-widest text-gray-500">
                              {status}
                            </div>
                          </div>

                          {/* MIDDLE: SCORE CONTAINER */}
                          <div className="flex shrink-0 justify-center px-2">
                            <div className="px-2 py-0.5 bg-gray-100 rounded-lg text-[10px] font-bold leading-none tracking-widest text-gray-500">
                              {score}
                            </div>
                          </div>

                          {/* RIGHT: PREDICTION / LOCK CONTAINER */}
                          <div className="flex-1 flex justify-end">
                            {isLocked ? (
                              <button
                                type="button"
                                onClick={() => setShowCheckoutModal(true)}
                                className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 border border-amber-300/80 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                                title="Unlock VIP prediction"
                              >
                                <Lock size={11} className="text-amber-800/80" />
                                <span className="text-[10px] font-bold uppercase leading-none tracking-widest text-amber-800/80">pro</span>
                              </button>
                            ) : (
                              <div className="flex items-center gap-1">
                                <div className="px-2 py-0.5 bg-gray-100 rounded-lg text-[10px] font-bold uppercase tracking-widest leading-none">
                                  <span className={predictionColorClass}>{tip}</span>
                                </div>
                                <div className="px-1.5 py-0.5 bg-orange-100 text-orange-800 border border-orange-200/80 rounded-lg text-[10px] font-bold tracking-widest leading-none">
                                  @{odds}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Children (Top Trends) & Footer rendered in exact homepage container flow */}
        {children}
        <Footer />
      </div>

      {/* Paystack Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xl w-full max-w-md relative text-center">
            <button
              onClick={() => setShowCheckoutModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-sm font-bold"
            >
              ✕
            </button>
            <div className="inline-flex p-3 rounded-full bg-amber-100 text-amber-600 mb-3">
              <Crown size={28} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-1">Unlock Today & Tomorrow Tips</h3>
            <p className="text-xs text-gray-600 mb-6">
              Subscribe for 3-5 daily odds at $19 per week to instantly unlock all predictions.
            </p>

            <PaystackCheckout amount={2500} currency="KES" displayText="Pay $19 to Unlock VIP" />
          </div>
        </div>
      )}

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
