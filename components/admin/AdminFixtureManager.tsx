"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Search, Edit3, X, Calendar, Sparkles, CheckCircle2, XCircle, Clock } from "lucide-react";

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

export default function AdminFixtureManager() {
  const [dates] = useState(() => buildKenyaDateStrip());
  const [selectedDate, setSelectedDate] = useState(() => kenyaYmdFormatter.format(new Date()));
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingFixture, setEditingFixture] = useState<any | null>(null);

  // Modal Form State
  const [customTip, setCustomTip] = useState("");
  const [customOdds, setCustomOdds] = useState("");
  const [customResult, setCustomResult] = useState<"pending" | "won" | "lost">("pending");
  const [isAdminPick, setIsAdminPick] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAdminFixtures = async (dateStr: string, query: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/fixtures?date=${dateStr}&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.fixtures) {
        setFixtures(data.fixtures);
      }
    } catch (err) {
      console.error("Failed to fetch admin fixtures:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminFixtures(selectedDate, searchQuery);
  }, [selectedDate, searchQuery]);

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

  const handleOpenEdit = (fx: any) => {
    setEditingFixture(fx);
    setCustomTip(fx.customPredictionTip || fx.predictionTip || "OV1.5");
    setCustomOdds(fx.customOdds || "1.85");
    setCustomResult(fx.customResult || getPredictionResultStatus(fx));
    setIsAdminPick(fx.isAdminPick !== undefined ? fx.isAdminPick : true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFixture) return;
    setSaving(true);

    try {
      const res = await fetch("/api/admin/fixtures", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fixtureId: editingFixture.fixtureId,
          customPredictionTip: customTip,
          customOdds: customOdds,
          customResult: customResult,
          isAdminPick: isAdminPick,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFixtures((prev) =>
          prev.map((f) =>
            f.fixtureId === editingFixture.fixtureId
              ? {
                  ...f,
                  customPredictionTip: customTip,
                  customOdds: customOdds,
                  customResult: customResult,
                  isAdminPick: isAdminPick,
                }
              : f
          )
        );
        setEditingFixture(null);
      } else {
        alert("Error saving fixture: " + data.error);
      }
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Group fixtures per league (matching homepage grouping)
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
    <div className="w-full space-y-4">
      {/* Date Navigator Bar & Search Icon (Placed right below dashboard/payments/premium tips row) */}
      <div className="w-full bg-gray-50 border border-gray-200 rounded-lg overflow-hidden shadow-xs">
        <div className="flex items-stretch w-full h-9 bg-gray-50 divide-x divide-gray-200">
          {/* Date Selector Strip */}
          <div className="flex-1 min-w-0 overflow-x-auto flex items-stretch scrollbar-hide no-scrollbar divide-x divide-gray-200">
            {dates.map((d, i) => {
              const dateStr = toYYYYMMDDUtc(d);
              const isActive = dateStr === selectedDate;
              const dayName = d.toLocaleDateString("en-GB", { weekday: "short", timeZone: KENYA_TZ });
              const dayNum = d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", timeZone: KENYA_TZ });

              return (
                <button
                  type="button"
                  key={i}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`flex-1 flex flex-col items-center justify-center min-w-[46px] sm:min-w-[56px] px-1 transition-all ${
                    isActive
                      ? "bg-teal-700 text-white shadow-inner font-bold"
                      : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase leading-tight">{dayName}</span>
                  <span className="text-[10px] font-bold leading-tight opacity-90">{dayNum}</span>
                </button>
              );
            })}
          </div>

          {/* Search Toggle / Form */}
          {isSearchOpen ? (
            <form onSubmit={(e) => e.preventDefault()} className="shrink-0 flex items-stretch divide-x divide-gray-200 bg-white">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search team or league..."
                className="w-32 sm:w-48 bg-transparent text-gray-900 text-xs px-2.5 outline-none font-medium"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setIsSearchOpen(false);
                }}
                className="w-9 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors text-sm font-bold"
                aria-label="Close search"
              >
                ×
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="shrink-0 w-10 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors bg-white"
              aria-label="Open search"
            >
              <Search size={15} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* Main Admin Predictions Fixtures Layout (Matches Homepage Max-Width & Styling) */}
      <div className="w-full md:max-w-2xl lg:max-w-2xl mx-auto space-y-3">
        <div className="p-2.5 bg-white rounded-lg border border-gray-200 shadow-xs flex justify-between items-center">
          <h2 className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-1.5">
            <Calendar size={15} className="text-teal-600" />
            Database Fixtures for {selectedDate} ({fixtures.length} matches)
          </h2>
          <span className="text-[11px] text-gray-500 font-medium hidden sm:inline-block">
            Homepage Layout • Click Edit to change result/tip
          </span>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg p-12 text-center text-gray-500 font-medium text-xs border border-gray-200">
            Loading database matches...
          </div>
        ) : Object.keys(groupedByLeague).length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center text-gray-500 font-medium text-xs border border-gray-200">
            No matches found for this date.
          </div>
        ) : (
          Object.entries(groupedByLeague).map(([key, group]) => (
            <div key={key} className="w-full">
              {/* Homepage Style League Header */}
              <div className="flex items-center gap-1 bg-gray-100 py-0.5 px-1 border border-gray-200 border-b-0">
                <div className="flex items-center gap-1.5 w-full">
                  {group.logo && (
                    <Image
                      src={group.logo}
                      alt={group.name}
                      width={16}
                      height={16}
                      className="w-4 h-4 flex-shrink-0 drop-shadow-xs object-contain"
                      unoptimized
                    />
                  )}
                  <div className="flex flex-col truncate w-full leading-tight">
                    <span className="font-bold text-[11px] text-teal-700 tracking-wide truncate">
                      {group.name}
                    </span>
                    <span className="text-[9px] text-gray-600 font-normal capitalize tracking-wider truncate">
                      {group.country.toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Homepage Style Match Cards */}
              <div className="flex flex-col">
                {group.matches.map((fx) => {
                  const home = fx.fixture?.teams?.home;
                  const away = fx.fixture?.teams?.away;
                  const rawStatus = fx.fixture?.fixture?.status?.short || "NS";
                  const dateIso = fx.fixture?.fixture?.date;
                  const kickoff = formatKickoffTime(dateIso);
                  const isLive = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"].includes(rawStatus);

                  const score =
                    fx.fixture?.goals?.home !== null && fx.fixture?.goals?.away !== null && fx.fixture?.goals?.home !== undefined
                      ? `${fx.fixture.goals.home}-${fx.fixture.goals.away}`
                      : "-";

                  const tip = fx.customPredictionTip || fx.predictionTip || "OV1.5";
                  const odds = fx.customOdds || "1.85";
                  const resStatus = getPredictionResultStatus(fx);

                  // Color styling just like homepage
                  let predictionBadgeColor = "text-orange-600 bg-amber-50 border-amber-200";
                  if (resStatus === "won") {
                    predictionBadgeColor = "text-[#22c55e] bg-emerald-50 border-emerald-200";
                  } else if (resStatus === "lost") {
                    predictionBadgeColor = "text-[#ef4444] bg-red-50 border-red-200";
                  }

                  return (
                    <div
                      key={fx.fixtureId}
                      className={`bg-white border border-gray-200 rounded-none py-1.5 px-2 hover:border-gray-300 transition-all flex flex-col ${
                        fx.isAdminPick ? "bg-amber-50/20" : ""
                      }`}
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
                          {kickoff}
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

                      {/* BOTTOM STRIP (Status, Score, Prediction Badge, Odds, Edit Button) */}
                      <div className="w-full flex items-center justify-between mt-1">
                        {/* LEFT: STATUS CONTAINER */}
                        <div className="flex-1 flex justify-start">
                          <div
                            className={`px-2 py-0.5 bg-gray-100 rounded-lg text-[10px] font-bold uppercase leading-none tracking-widest ${
                              isLive ? "text-red-500 animate-pulse" : "text-gray-500"
                            }`}
                          >
                            {rawStatus}
                          </div>
                        </div>

                        {/* MIDDLE: SCORE CONTAINER */}
                        <div className="flex shrink-0 justify-center px-2">
                          <div
                            className={`px-2 py-0.5 bg-gray-100 rounded-lg text-[10px] font-bold leading-none tracking-widest ${
                              isLive ? "text-red-500 animate-pulse" : "text-gray-500"
                            }`}
                          >
                            {score}
                          </div>
                        </div>

                        {/* RIGHT: PREDICTION TIP, ODDS & EDIT ACTION */}
                        <div className="flex-1 flex items-center justify-end gap-1.5">
                          <div
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest leading-none border ${predictionBadgeColor}`}
                          >
                            {tip}
                          </div>

                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded-lg border border-amber-200">
                            @{odds}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(fx)}
                            className="flex items-center gap-1 px-2 py-0.5 bg-gray-900 hover:bg-teal-700 text-white font-bold text-[10px] rounded-lg transition-all"
                          >
                            <Edit3 size={11} />
                            <span>Edit</span>
                          </button>
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

      {/* Edit Modal */}
      {editingFixture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xl w-full max-w-md relative">
            <button
              onClick={() => setEditingFixture(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" />
              Edit Fixture Tip & Result
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {editingFixture.fixture?.teams?.home?.name} vs {editingFixture.fixture?.teams?.away?.name}
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Custom Prediction Tip */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Custom Prediction Tip</label>
                <input
                  type="text"
                  value={customTip}
                  onChange={(e) => setCustomTip(e.target.value)}
                  placeholder="e.g. OV1.5, BTTS, 1, 2, UN3.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  required
                />
              </div>

              {/* Custom Odds */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Odds</label>
                <input
                  type="text"
                  value={customOdds}
                  onChange={(e) => setCustomOdds(e.target.value)}
                  placeholder="e.g. 1.85, 2.10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  required
                />
              </div>

              {/* Prediction Result Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Prediction Result Status</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomResult("pending")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                      customResult === "pending"
                        ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <Clock size={13} />
                    <span>Pending</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomResult("won")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                      customResult === "won"
                        ? "bg-[#22c55e] text-white border-emerald-600 shadow-xs"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <CheckCircle2 size={13} />
                    <span>Won</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomResult("lost")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                      customResult === "lost"
                        ? "bg-[#ef4444] text-white border-red-600 shadow-xs"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <XCircle size={13} />
                    <span>Lost</span>
                  </button>
                </div>
              </div>

              {/* VIP Display Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isAdminPick"
                  checked={isAdminPick}
                  onChange={(e) => setIsAdminPick(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 cursor-pointer"
                />
                <label htmlFor="isAdminPick" className="text-xs font-bold text-gray-800 cursor-pointer">
                  Display in Logged-In VIP Predictions Page
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingFixture(null)}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2"
                >
                  {saving ? "Saving..." : "Save Fixture"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
