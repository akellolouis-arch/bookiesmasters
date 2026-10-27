"use client";

import React from "react";
import Image from "next/image";
import { ArrowDownRight, ArrowUpRight, AlertCircle, Video } from "lucide-react";

export interface MatchEvent {
  time: {
    elapsed: number;
    extra?: number | null;
  };
  team: {
    id: number;
    name: string;
    logo?: string;
  };
  player: {
    id?: number;
    name: string;
  };
  assist?: {
    id?: number;
    name: string;
  };
  type: string; // "Goal", "Card", "subst", "Var"
  detail: string; // "Normal Goal", "Yellow Card", "Red Card", etc.
  comments?: string | null;
}

interface MatchEventsProps {
  events: MatchEvent[];
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  status?: string;
}

export default function MatchEvents({
  events = [],
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  status,
}: MatchEventsProps) {
  if (!events || events.length === 0) {
    const isLive = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(status || "");
    return (
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 text-center max-w-2xl mx-auto my-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2 text-gray-400">
          ⚽
        </div>
        <p className="text-xs font-semibold text-gray-700">No match events recorded yet</p>
        <p className="text-[11px] text-gray-400 mt-1">
          {isLive
            ? "Live events will update automatically as goals and cards happen."
            : "Goals, cards, and substitutions will appear once the match kicks off."}
        </p>
      </div>
    );
  }

  // Sort events chronologically (1' to 90'+)
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = ((a?.time?.elapsed) || 0) + ((a?.time?.extra) || 0) * 0.1;
    const timeB = ((b?.time?.elapsed) || 0) + ((b?.time?.extra) || 0) * 0.1;
    return timeA - timeB;
  });

  // Group events by period
  const firstHalf = sortedEvents.filter((e) => ((e?.time?.elapsed) || 0) <= 45);
  const secondHalf = sortedEvents.filter(
    (e) => ((e?.time?.elapsed) || 0) > 45 && ((e?.time?.elapsed) || 0) <= 90
  );
  const extraTime = sortedEvents.filter((e) => ((e?.time?.elapsed) || 0) > 90);

  const renderEventIcon = (event: MatchEvent) => {
    const type = event.type?.toLowerCase();
    const detail = event.detail?.toLowerCase() || "";

    if (type === "goal") {
      if (detail.includes("missed")) {
        return (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-bold">
            ✕
          </span>
        );
      }
      if (detail.includes("own goal")) {
        return (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-50 text-rose-600 text-[11px]" title="Own Goal">
            ⚽
          </span>
        );
      }
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] shadow-xs">
          ⚽
        </span>
      );
    }

    if (type === "card") {
      if (detail.includes("yellow") && detail.includes("red")) {
        return (
          <span className="inline-flex items-center gap-0.5" title="Second Yellow / Red">
            <span className="w-2.5 h-3.5 bg-amber-400 rounded-xs shadow-xs inline-block" />
            <span className="w-2.5 h-3.5 bg-rose-600 rounded-xs shadow-xs inline-block" />
          </span>
        );
      }
      if (detail.includes("yellow")) {
        return (
          <span
            className="w-2.5 h-3.5 bg-amber-400 border border-amber-500/40 rounded-xs shadow-xs inline-block"
            title="Yellow Card"
          />
        );
      }
      return (
        <span
          className="w-2.5 h-3.5 bg-rose-600 border border-rose-700/40 rounded-xs shadow-xs inline-block"
          title="Red Card"
        />
      );
    }

    if (type === "subst") {
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-blue-600">
          <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
        </span>
      );
    }

    if (type === "var") {
      return (
        <span className="inline-flex items-center justify-center px-1 py-0.5 bg-purple-100 text-purple-700 rounded text-[9px] font-bold">
          VAR
        </span>
      );
    }

    return (
      <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
    );
  };

  const renderEventDetails = (event: MatchEvent, isHome: boolean) => {
    const type = event.type?.toLowerCase();
    const detail = event.detail || "";
    const isGoal = type === "goal";
    const isSub = type === "subst";
    const isCard = type === "card";

    return (
      <div className={`flex flex-col min-w-0 ${isHome ? "items-end text-right" : "items-start text-left"}`}>
        {/* Main Player or Action */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[11px] sm:text-[12px] font-bold truncate max-w-[140px] sm:max-w-[190px] ${isGoal ? "text-emerald-700" : "text-gray-900"}`}>
            {isSub && event.assist?.name ? event.assist.name : event.player?.name || "Player"}
          </span>

          {/* Sub badge if applicable */}
          {isGoal && detail && (
            <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-gray-100 text-gray-600">
              {detail.includes("Penalty") ? "PEN" : detail.includes("Own Goal") ? "OG" : "Goal"}
            </span>
          )}
        </div>

        {/* Sub details / Assist */}
        {isGoal && event.assist?.name && (
          <span className="text-[10px] text-gray-500 font-normal">
            Assist: {event.assist.name}
          </span>
        )}

        {isSub && event.player?.name && (
          <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
            <ArrowUpRight className="w-2.5 h-2.5 text-rose-500 inline" />
            <span className="truncate max-w-[120px] sm:max-w-[160px]">{event.player.name}</span>
          </span>
        )}

        {type === "var" && (
          <span className="text-[10px] text-purple-700 font-medium">
            {detail}
          </span>
        )}
      </div>
    );
  };

  const renderEventRow = (event: MatchEvent, idx: number) => {
    const isHome =
      event.team?.id === homeTeamId ||
      (homeTeamName && event.team?.name?.toLowerCase().includes(homeTeamName.toLowerCase()));

    const minuteStr = event.time.extra
      ? `${event.time.elapsed}+${event.time.extra}'`
      : `${event.time.elapsed}'`;

    return (
      <div
        key={`${event.time.elapsed}-${event.player?.name || idx}-${idx}`}
        className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60 transition-colors px-2"
      >
        {/* Left Column: Home Team Event */}
        <div className="flex items-center justify-end gap-2 min-w-0">
          {isHome ? (
            <>
              {renderEventDetails(event, true)}
              <div className="shrink-0">{renderEventIcon(event)}</div>
            </>
          ) : (
            <div className="w-full" />
          )}
        </div>

        {/* Center: Minute Badge */}
        <div className="shrink-0 flex items-center justify-center">
          <span className="w-8 sm:w-9 h-5 sm:h-5.5 rounded-full bg-gray-100 border border-gray-200 text-gray-700 text-[9px] sm:text-[10px] font-bold flex items-center justify-center shadow-xs">
            {minuteStr}
          </span>
        </div>

        {/* Right Column: Away Team Event */}
        <div className="flex items-center justify-start gap-2 min-w-0">
          {!isHome ? (
            <>
              <div className="shrink-0">{renderEventIcon(event)}</div>
              {renderEventDetails(event, false)}
            </>
          ) : (
            <div className="w-full" />
          )}
        </div>
      </div>
    );
  };

  const renderPeriodHeader = (title: string) => (
    <div className="flex items-center justify-center my-2">
      <span className="px-3 py-0.5 rounded-full bg-gray-200/80 text-gray-700 text-[10px] font-bold uppercase tracking-wider">
        {title}
      </span>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-2 sm:p-4 max-w-2xl mx-auto my-3">
      {/* Header */}
      <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-gray-200">
        <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wider truncate max-w-[40%] text-left">
          {homeTeamName}
        </span>
        <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          Match Events
        </span>
        <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wider truncate max-w-[40%] text-right">
          {awayTeamName}
        </span>
      </div>

      {/* Events Stream */}
      <div className="space-y-1">
        {firstHalf.length > 0 && (
          <>
            {renderPeriodHeader("1st Half")}
            {firstHalf.map((event, idx) => renderEventRow(event, idx))}
          </>
        )}

        {secondHalf.length > 0 && (
          <>
            {renderPeriodHeader("2nd Half")}
            {secondHalf.map((event, idx) => renderEventRow(event, idx + 100))}
          </>
        )}

        {extraTime.length > 0 && (
          <>
            {renderPeriodHeader("Extra Time")}
            {extraTime.map((event, idx) => renderEventRow(event, idx + 200))}
          </>
        )}
      </div>
    </div>
  );
}

