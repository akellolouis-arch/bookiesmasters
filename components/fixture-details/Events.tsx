import React from "react";

interface EventTeam {
    id: number;
    name: string;
    logo: string;
}

interface EventPlayer {
    id: number;
    name: string;
}

interface FixtureEvent {
    time: {
        elapsed: number;
        extra?: number;
    };
    team: EventTeam;
    player: EventPlayer;
    assist: EventPlayer;
    type: string; // "Goal", "Card", "subst", "Var"
    detail: string; // "Yellow Card", "Normal Goal", etc.
    comments?: string;
}

interface EventsProps {
    events: FixtureEvent[];
    homeTeamId: number;
    awayTeamId: number;
    status: string;
    score?: {
        halftime?: { home: number | null; away: number | null };
    } | null;
}

const Events: React.FC<EventsProps> = ({ events, homeTeamId, status, score }) => {
    if (!events || events.length === 0) {
        return (
            <div className="text-center py-6 text-gray-500 w-full">
                <p className="text-sm">No match events available</p>
            </div>
        );
    }

    return (
        <div className="w-full relative py-1">
            {/* Center Line */}
            <div className="absolute left-1/2 top-4 bottom-4 w-px bg-white/5 transform -translate-x-1/2"></div>

            <div className="space-y-1">
                {(() => {
                    const renderItems: React.ReactNode[] = [];
                    let htInserted = false;
                    
                    let htString = "HT";
                    if (score?.halftime && score.halftime.home !== null && score.halftime.away !== null) {
                        htString = `HT ${score.halftime.home} - ${score.halftime.away}`;
                    }

                    events.forEach((event, idx) => {
                        if (!htInserted && event.time?.elapsed > 45) {
                            renderItems.push(
                                <div key={`ht-${idx}`} className="flex justify-center w-full my-3 relative z-10">
                                    <div className="text-[10px] font-bold text-gray-500 bg-[#0a0a0a] px-3 py-1 border border-white/5 rounded-full uppercase tracking-widest whitespace-nowrap">
                                        {htString}
                                    </div>
                                </div>
                            );
                            htInserted = true;
                        }

                        const isHome = event.team.id === homeTeamId;
                        const eventIcon = getEventEmoji(event.type, event.detail);
                        const isGoal = event.type?.toLowerCase() === 'goal';
                        const playerName = event.player?.name && event.player.name !== "Unknown" ? event.player.name : null;
                        const assistName = event.assist?.name && event.assist.name !== "Unknown" ? event.assist.name : null;

                        renderItems.push(
                            <div key={`evt-${idx}`} className="flex items-center w-full">
                                {/* Home Side */}
                                <div className="flex-1 flex justify-start pr-2 items-center">
                                    {isHome && (
                                        <div className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2">
                                            <div className="w-4 flex justify-center shrink-0">{eventIcon}</div>
                                            <div className="text-left">
                                                {playerName && <div className="text-xs text-gray-200 font-medium leading-tight">{playerName}</div>}
                                                {!isGoal && <div className="text-[11px] text-gray-500">{event.detail}</div>}
                                                {assistName && (
                                                    <div className="text-[10px] text-gray-500">Assist: {assistName}</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Time */}
                                <div className="relative z-10 w-7 h-7 flex-shrink-0 rounded-full bg-[#0a0a0a] flex items-center justify-center text-xs font-bold text-gray-400">
                                    {event.time?.elapsed || 0}'
                                    {event.time?.extra ? <span className="text-[9px] text-gray-500 ml-0.5">+{event.time.extra}</span> : ''}
                                </div>

                                {/* Away Side */}
                                <div className="flex-1 flex justify-end pl-2 items-center">
                                    {!isHome && (
                                        <div className="flex items-center gap-1.5 sm:gap-2 pr-1 sm:pr-2">
                                            <div className="text-right">
                                                {playerName && <div className="text-xs text-gray-200 font-medium leading-tight">{playerName}</div>}
                                                {!isGoal && <div className="text-[11px] text-gray-500">{event.detail}</div>}
                                                {assistName && (
                                                    <div className="text-[10px] text-gray-500">Assist: {assistName}</div>
                                                )}
                                            </div>
                                            <div className="w-4 flex justify-center shrink-0">{eventIcon}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    });

                    if (!htInserted && ['HT', '2H', 'FT', 'AET', 'PEN'].includes(status)) {
                        renderItems.push(
                            <div key="ht-end" className="flex justify-center w-full my-3 relative z-10">
                                <div className="text-[10px] font-bold text-gray-500 bg-[#0a0a0a] px-3 py-1 border border-white/5 rounded-full uppercase tracking-widest whitespace-nowrap">
                                    {htString}
                                </div>
                            </div>
                        );
                    }

                    if (['FT', 'AET', 'PEN'].includes(status)) {
                        renderItems.push(
                            <div key="ft-end" className="flex justify-center w-full mt-4 mb-1 relative z-10">
                                <div className="text-[10px] font-bold text-gray-500 bg-[#0a0a0a] px-3 py-1 border border-white/5 rounded-full uppercase tracking-widest whitespace-nowrap">
                                    FT
                                </div>
                            </div>
                        );
                    }

                    return renderItems;
                })()}
            </div>
        </div>
    );
}

function getEventEmoji(type: string, detail: string) {
    if (!type) return <div className="text-sm">🔹</div>;

    switch (type.toLowerCase()) {
        case 'goal':
            return <div className="text-sm">⚽</div>;
        case 'subst':
            return <div className="text-sm">🔄</div>;
        case 'card':
            if (detail && detail.toLowerCase().includes('yellow')) return <div className="w-3 h-4 bg-yellow-500 rounded-sm"></div>;
            if (detail && detail.toLowerCase().includes('red')) return <div className="w-3 h-4 bg-red-600 rounded-sm"></div>;
            return <div className="w-3 h-4 bg-gray-400 rounded-sm"></div>;
        case 'var':
            return <div className="text-[10px] bg-zinc-700 px-1 border border-zinc-600 rounded text-gray-300">VAR</div>;
        default:
            return <div className="text-sm">🔹</div>;
    }
}

export default Events;
