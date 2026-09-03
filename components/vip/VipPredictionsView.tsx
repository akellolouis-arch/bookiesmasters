"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Lock, Crown, Calendar, Sparkles, CheckCircle2 } from "lucide-react";
import PaystackCheckout from "@/components/PaystackCheckout";

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

interface VipPredictionsViewProps {
  isVip: boolean;
}

export default function VipPredictionsView({ isVip }: VipPredictionsViewProps) {
  const [dates] = useState(() => buildKenyaDateStrip());
  const todayYmd = kenyaYmdFormatter.format(new Date());

  const [selectedDate, setSelectedDate] = useState(todayYmd);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Tomorrow YMD calculation
  const tomorrowObj = new Date(new Date().getTime() + 86400000);
  const tomorrowYmd = kenyaYmdFormatter.format(tomorrowObj);

  const isTodayOrTomorrow = selectedDate === todayYmd || selectedDate === tomorrowYmd;
  const isLocked = isTodayOrTomorrow && !isVip;

  useEffect(() => {
    async function fetchVipFixtures() {
      setLoading(true);
      try {
        const res = await fetch(`/api/vip/predictions?date=${selectedDate}`);
        const data = await res.json();
        if (data.fixtures) {
          setFixtures(data.fixtures);
        }
      } catch (err) {
        console.error("Failed to fetch VIP predictions:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchVipFixtures();
  }, [selectedDate]);

  // Group fixtures by league (similar to homepage)
  const groupedByLeague: Record<string, { leagueName: string; flag: string; country: string; matches: any[] }> = {};
  fixtures.forEach((fx) => {
    const league = fx.fixture?.league;
    const key = `${league?.country || "World"}_${league?.name || "Other"}`;
    if (!groupedByLeague[key]) {
      groupedByLeague[key] = {
        leagueName: league?.name || "Other League",
        flag: league?.flag || league?.logo || "",
        country: league?.country || "World",
        matches: [],
      };
    }
    groupedByLeague[key].matches.push(fx);
  });

  return (
    <div className="space-y-6">
      {/* Date Navigator Bar */}
      <div className="max-w-3xl mx-auto w-full bg-gray-50 border-y border-gray-200 shadow-xs">
        <div className="flex items-center overflow-x-auto scrollbar-hide divide-x divide-gray-200">
          {dates.map((d, i) => {
            const dateStr = toYYYYMMDDUtc(d);
            const isActive = dateStr === selectedDate;
            const dayName = d.toLocaleDateString("en-GB", { weekday: "short", timeZone: KENYA_TZ });
            const dateDisplay = d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", timeZone: KENYA_TZ });

            return (
              <button
                type="button"
                key={i}
                onClick={() => setSelectedDate(dateStr)}
                className={`flex-1 flex flex-col items-center justify-center min-w-[55px] py-2 transition-all ${
                  isActive
                    ? "bg-teal-700 text-white font-bold shadow-inner"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span className="text-[10px] uppercase leading-tight font-bold">{dayName}</span>
                <span className="text-[10px] leading-tight opacity-90">{dateDisplay}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Fixtures Container */}
      <div className="max-w-3xl mx-auto space-y-4 px-2 sm:px-0">
        <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-gray-900 text-sm">
              Admin VIP Predictions ({selectedDate})
            </h2>
          </div>
          {isLocked && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200">
              <Lock size={12} /> Today & Tomorrow Locked
            </span>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-500 font-medium text-sm border border-gray-200">
            Loading VIP predictions...
          </div>
        ) : Object.keys(groupedByLeague).length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200 space-y-2">
            <div className="text-gray-400 flex justify-center">
              <Calendar size={32} />
            </div>
            <p className="text-gray-700 font-bold text-sm">No Admin VIP predictions posted for this date yet.</p>
            <p className="text-xs text-gray-500">Check back shortly or select another date on the navigator above.</p>
          </div>
        ) : (
          Object.entries(groupedByLeague).map(([key, group]) => (
            <div key={key} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
              {/* League Header */}
              <div className="bg-gray-100/90 px-3 py-1.5 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {group.flag && (
                    <Image src={group.flag} alt={group.country} width={14} height={14} className="w-3.5 h-3.5 object-contain" />
                  )}
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    {group.country} - {group.leagueName}
                  </span>
                </div>
              </div>

              {/* Match Cards */}
              <div className="divide-y divide-gray-100">
                {group.matches.map((fx) => {
                  const home = fx.fixture?.teams?.home;
                  const away = fx.fixture?.teams?.away;
                  const status = fx.fixture?.fixture?.status?.short || "NS";
                  const score = fx.fixture?.goals?.home !== null && fx.fixture?.goals?.away !== null
                    ? `${fx.fixture.goals.home}-${fx.fixture.goals.away}`
                    : "-";
                  const tip = fx.customPredictionTip || fx.predictionTip || "OV1.5";
                  const odds = fx.customOdds || "1.85";

                  return (
                    <div
                      key={fx.fixtureId}
                      className="py-2.5 px-3 hover:bg-gray-50 transition-colors flex flex-col gap-1.5"
                    >
                      {/* Teams & Kickoff */}
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full gap-2">
                        {/* Home Team */}
                        <div className="flex items-center justify-end gap-1.5 min-w-0">
                          <span className="font-bold text-xs truncate text-gray-900 text-right">{home?.name}</span>
                          {home?.logo && (
                            <Image src={home.logo} alt={home.name} width={16} height={16} className="w-4 h-4 object-contain shrink-0" unoptimized />
                          )}
                        </div>

                        {/* VS / Score Center */}
                        <span className="text-[10px] font-bold text-gray-400 px-2 shrink-0 text-center">
                          VS
                        </span>

                        {/* Away Team */}
                        <div className="flex items-center justify-start gap-1.5 min-w-0">
                          {away?.logo && (
                            <Image src={away.logo} alt={away.name} width={16} height={16} className="w-4 h-4 object-contain shrink-0" unoptimized />
                          )}
                          <span className="font-bold text-xs truncate text-gray-900 text-left">{away?.name}</span>
                        </div>
                      </div>

                      {/* Bottom Details Strip */}
                      <div className="w-full flex items-center justify-between pt-1 border-t border-gray-100">
                        {/* Status */}
                        <div className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold uppercase text-gray-600">
                          {status}
                        </div>

                        {/* Score */}
                        <div className="px-2.5 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-800">
                          {score}
                        </div>

                        {/* Prediction / Lock Badge */}
                        <div>
                          {isLocked ? (
                            <button
                              onClick={() => setShowCheckoutModal(true)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] rounded shadow-xs transition-all transform hover:scale-105"
                            >
                              <Lock size={10} />
                              <span>LOCKED (VIP)</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="px-2.5 py-0.5 bg-teal-100 text-teal-800 font-bold text-[10px] rounded uppercase border border-teal-200">
                                {tip}
                              </span>
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded border border-amber-200">
                                @{odds}
                              </span>
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
              <Crown size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-1">Unlock Today & Tomorrow Tips</h3>
            <p className="text-xs text-gray-600 mb-6">
              Subscribe to VIP pass to instantly unlock all Admin-edited predictions.
            </p>

            <PaystackCheckout amount={2500} currency="KES" displayText="Pay $19 to Unlock VIP" />
          </div>
        </div>
      )}
    </div>
  );
}
