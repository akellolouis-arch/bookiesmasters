"use client";

import React from "react";
import { ArrowRightLeft } from "lucide-react";

interface MatchEvent {
  time: {
    elapsed: number;
    extra: number | null;
  };
  team: {
    id: number;
    name: string;
    logo: string;
  };
  player: {
    id: number | null;
    name: string | null;
  };
  assist: {
    id: number | null;
    name: string | null;
  };
  type: string;
  detail: string;
  comments: string | null;
}

interface MatchEventsProps {
  events: MatchEvent[];
  homeTeamId: number;
  awayTeamId: number;
}

const SubstitutionIcon = () => (
  <div className="relative flex items-center justify-center w-4 h-4">
    <ArrowRightLeft size={14} className="text-red-500 absolute top-[-2px] left-[-2px]" />
    <ArrowRightLeft size={14} className="text-green-500 absolute bottom-[-2px] right-[-2px]" />
  </div>
);
// Above logic for sub icon might be messy, let's use a simpler custom SVG for the sub icon.
const SubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 4L20 8L16 12" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 8H20" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 20L4 16L8 12" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 16H4" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const GoalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" fill="white"/>
    <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" fill="black"/>
  </svg>
);

const OwnGoalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2" fill="#ef4444"/>
    <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" fill="black"/>
  </svg>
);


export default function MatchEvents({ events, homeTeamId, awayTeamId }: MatchEventsProps) {
  if (!events || events.length === 0) return null;

  // Process events to add running score
  let currentHomeScore = 0;
  let currentAwayScore = 0;
  
  const processedEvents = events.map(event => {
    let scoreString = null;
    
    if (event.type === "Goal") {
      if (event.detail === "Own Goal") {
        if (event.team.id === homeTeamId) {
          currentAwayScore += 1;
        } else {
          currentHomeScore += 1;
        }
      } else {
        if (event.team.id === homeTeamId) {
          currentHomeScore += 1;
        } else {
          currentAwayScore += 1;
        }
      }
      scoreString = `${currentHomeScore} - ${currentAwayScore}`;
    }
    
    return {
      ...event,
      runningScore: scoreString,
      sortMinute: event.time.elapsed + (event.time.extra ? event.time.extra / 100 : 0)
    };
  });

  // Sort descending by time
  processedEvents.sort((a, b) => b.sortMinute - a.sortMinute);

  const getEventIcon = (event: typeof processedEvents[0]) => {
    if (event.type === "Goal") {
       return event.detail === "Own Goal" ? <OwnGoalIcon /> : <GoalIcon />;
    }
    if (event.type === "subst") {
      return <SubIcon />;
    }
    if (event.type === "Card") {
      if (event.detail === "Yellow Card") return <div className="w-3 h-4 bg-yellow-400 rounded-[1px] shadow-sm"></div>;
      if (event.detail === "Red Card") return <div className="w-3 h-4 bg-red-500 rounded-[1px] shadow-sm"></div>;
      if (event.detail === "Yellow Card (Second)") return (
        <div className="relative w-3 h-4">
          <div className="absolute top-0 left-0 w-3 h-4 bg-yellow-400 rounded-[1px] shadow-sm"></div>
          <div className="absolute top-1 left-1 w-3 h-4 bg-red-500 rounded-[1px] shadow-sm"></div>
        </div>
      );
    }
    return null;
  };

  const renderEventContent = (event: typeof processedEvents[0], isHome: boolean) => {
    const isGoal = event.type === "Goal";
    const isSub = event.type === "subst";
    const isCard = event.type === "Card";

    const content = (
      <div className="flex items-center gap-2 text-xs sm:text-sm">
        {/* Secondary Info (Assist/Player leaving) */}
        {isSub && event.player.name && (
            <span className="text-gray-400">{event.player.name}</span>
        )}
        {isGoal && event.assist.name && (
            <span className="text-gray-400">{event.assist.name}</span>
        )}
        
        {/* Main Player */}
        {isSub && event.assist.name && (
            <span className="text-white font-medium">{event.assist.name}</span>
        )}
        {isGoal && event.player.name && (
             <span className="text-white font-medium">{event.player.name}</span>
        )}
        {isCard && event.player.name && (
             <span className="text-white font-medium">{event.player.name}</span>
        )}

        {/* Card Comments/Details */}
        {isCard && (
             <span className="text-gray-400">{event.comments || event.detail}</span>
        )}
        
        {/* Goal Pill */}
        {isGoal && event.runningScore && (
          <div className="flex items-center gap-1 bg-[#1e2336] border border-[#2b324d] rounded-full px-2 py-0.5 ml-1">
             <span className="text-blue-400 mr-1">▶</span>
             <span className="text-white font-bold">{event.runningScore}</span>
          </div>
        )}
      </div>
    );

    const timeString = `${event.time.elapsed}'${event.time.extra ? `+${event.time.extra}` : ""}`;
    const icon = getEventIcon(event);

    if (isHome) {
      return (
        <div className="flex items-center w-full">
           <div className="w-1/2 flex items-center justify-end pr-4 gap-3">
              <div className="text-gray-200">{content}</div>
              <div className="flex-shrink-0">{icon}</div>
              <div className="w-8 text-right font-bold text-gray-200">{timeString}</div>
           </div>
           <div className="w-1/2"></div>
        </div>
      );
    } else {
      return (
        <div className="flex items-center w-full">
           <div className="w-1/2"></div>
           <div className="w-1/2 flex items-center justify-start pl-4 gap-3">
              <div className="w-8 text-left font-bold text-gray-200">{timeString}</div>
              <div className="flex-shrink-0">{icon}</div>
              <div className="text-gray-200">{content}</div>
           </div>
        </div>
      );
    }
  };

  return (
    <div className="relative py-4 bg-[#141824] rounded-xl border border-white/5 overflow-hidden">
      <div className="flex justify-center mb-6">
          <h3 className="inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-1 bg-white/5 backdrop-blur-sm border border-white/10 text-amber-100 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold shadow-lg tracking-wide uppercase">
              Match Events
          </h3>
      </div>
      
      <div className="relative max-w-2xl mx-auto px-2">
        {/* Center Line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/10 -translate-x-1/2"></div>
        
        <div className="flex flex-col gap-4">
          {processedEvents.map((event, idx) => (
             <div key={idx} className="relative z-10 w-full">
               {renderEventContent(event, event.team.id === homeTeamId)}
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}
