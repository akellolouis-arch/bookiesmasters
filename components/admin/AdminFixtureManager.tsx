"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Search, Edit3, X, Calendar, Sparkles } from "lucide-react";

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
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingFixture, setEditingFixture] = useState<any | null>(null);

  // Form State
  const [customTip, setCustomTip] = useState("");
  const [customOdds, setCustomOdds] = useState("");
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

  const handleOpenEdit = (fx: any) => {
    setEditingFixture(fx);
    setCustomTip(fx.customPredictionTip || fx.predictionTip || "OV1.5");
    setCustomOdds(fx.customOdds || "1.85");
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
    <div className="space-y-6">
      {/* Date Navigator & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-hide">
          {dates.map((d, i) => {
            const dateStr = toYYYYMMDDUtc(d);
            const isActive = dateStr === selectedDate;
            const dayName = d.toLocaleDateString("en-GB", { weekday: "short", timeZone: KENYA_TZ });
            const dayNum = d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", timeZone: KENYA_TZ });

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(dateStr)}
                className={`flex flex-col items-center justify-center px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all min-w-[60px] ${
                  isActive
                    ? "bg-teal-700 text-white shadow-md scale-105"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span className="uppercase text-[10px] opacity-80">{dayName}</span>
                <span>{dayNum}</span>
              </button>
            );
          })}
        </div>

        {/* Team Search Bar */}
        <div className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search team or league..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Fixtures Grouped per League (Homepage Layout Style) */}
      <div className="w-full md:max-w-3xl mx-auto space-y-4">
        <div className="p-3.5 bg-white rounded-xl border border-gray-200 shadow-xs flex justify-between items-center">
          <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Calendar size={16} className="text-teal-600" />
            Database Fixtures for {selectedDate} ({fixtures.length} matches)
          </h2>
          <span className="text-xs text-gray-500 font-medium hidden sm:inline-block">
            Grouped per League • Click Edit to customize tips
          </span>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-500 font-medium text-sm border border-gray-200">
            Loading database matches...
          </div>
        ) : Object.keys(groupedByLeague).length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-500 font-medium text-sm border border-gray-200">
            No matches found in database for this date.
          </div>
        ) : (
          Object.entries(groupedByLeague).map(([key, group]) => (
            <div key={key} className="bg-white border border-gray-200 rounded-none overflow-hidden shadow-xs">
              {/* Homepage Style League Header */}
              <div className="flex items-center gap-1.5 bg-gray-100 py-1 px-2 border-b border-gray-200">
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

              {/* Homepage Style Match Cards */}
              <div className="divide-y divide-gray-100">
                {group.matches.map((fx) => {
                  const home = fx.fixture?.teams?.home;
                  const away = fx.fixture?.teams?.away;
                  const rawStatus = fx.fixture?.fixture?.status?.short || "NS";
                  const dateIso = fx.fixture?.fixture?.date;
                  const kickoff = formatKickoffTime(dateIso);

                  const score = fx.fixture?.goals?.home !== null && fx.fixture?.goals?.away !== null
                    ? `${fx.fixture.goals.home}-${fx.fixture.goals.away}`
                    : "-";
                  const tip = fx.customPredictionTip || fx.predictionTip || "OV1.5";
                  const odds = fx.customOdds || "1.85";

                  return (
                    <div
                      key={fx.fixtureId}
                      className={`p-2 hover:bg-gray-50 transition-colors flex flex-col gap-1.5 ${
                        fx.isAdminPick ? "bg-amber-50/30" : ""
                      }`}
                    >
                      {/* Matchup Row: Home vs Away + Kickoff Time */}
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full gap-2">
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

                        {/* KICKOFF TIME CENTER BOX */}
                        <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 px-2 shrink-0 text-center min-w-[42px] bg-gray-100 rounded py-0.5">
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

                      {/* Bottom Details Strip */}
                      <div className="w-full flex items-center justify-between pt-1 border-t border-gray-100">
                        {/* Status */}
                        <div className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold uppercase text-gray-500">
                          {rawStatus}
                        </div>

                        {/* Score */}
                        <div className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-700">
                          {score}
                        </div>

                        {/* VIP Prediction & Odds + Edit Action */}
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-teal-100 text-teal-800 font-bold text-[10px] rounded border border-teal-200">
                            {tip}
                          </span>
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded border border-amber-200">
                            @{odds}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(fx)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-gray-900 hover:bg-teal-700 text-white font-bold text-[10px] rounded shadow-xs transition-all ml-1"
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
              Edit Prediction & Odds
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {editingFixture.fixture?.teams?.home?.name} vs {editingFixture.fixture?.teams?.away?.name}
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Custom Prediction Tip</label>
                <input
                  type="text"
                  value={customTip}
                  onChange={(e) => setCustomTip(e.target.value)}
                  placeholder="e.g. OV1.5, BTTS, 1, 2, UN3.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Odds</label>
                <input
                  type="text"
                  value={customOdds}
                  onChange={(e) => setCustomOdds(e.target.value)}
                  placeholder="e.g. 1.85, 2.10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isAdminPick"
                  checked={isAdminPick}
                  onChange={(e) => setIsAdminPick(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <label htmlFor="isAdminPick" className="text-xs font-bold text-gray-800 cursor-pointer">
                  Display in Logged-In VIP Predictions Page
                </label>
              </div>

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
                  {saving ? "Saving..." : "Save Prediction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
