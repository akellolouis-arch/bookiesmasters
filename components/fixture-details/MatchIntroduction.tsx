import React from 'react';

interface MatchData {
    score?: { home: number | null; away: number | null };
    goals?: { home: number | null; away: number | null };
}

interface MatchIntroductionProps {
    homeTeamName: string;
    awayTeamName: string;
    venue?: string;
    homeMatches?: MatchData[];
    awayMatches?: MatchData[];
    h2hMatches?: MatchData[];
    status?: string;
    score?: { home: number | null; away: number | null } | null;
}

const MatchIntroduction: React.FC<MatchIntroductionProps> = ({
    homeTeamName,
    awayTeamName,
    venue,
    homeMatches = [],
    awayMatches = [],
    h2hMatches = [],
    status,
    score,
}) => {
    const calculateStats = (matches: MatchData[], limit: number) => {
        const recent = matches.slice(0, limit);
        let total = 0;
        let over15 = 0, under15 = 0;
        let over25 = 0, under25 = 0;
        let over35 = 0, under35 = 0;

        recent.forEach((m) => {
            const homeGoals = m.score?.home ?? m.goals?.home;
            const awayGoals = m.score?.away ?? m.goals?.away;
            
            if (homeGoals !== undefined && homeGoals !== null && awayGoals !== undefined && awayGoals !== null) {
                total++;
                const tg = homeGoals + awayGoals;
                if (tg > 1.5) over15++; else under15++;
                if (tg > 2.5) over25++; else under25++;
                if (tg > 3.5) over35++; else under35++;
            }
        });

        return {
            total,
            over15, under15,
            over25, under25,
            over35, under35,
        };
    };

    const homeStats = calculateStats(homeMatches, 5);
    const awayStats = calculateStats(awayMatches, 5);
    const h2hStats = calculateStats(h2hMatches, 5);

    // 1. Base Sentence
    const baseSentence = venue && venue.trim() !== "" && venue !== "Unknown venue"
        ? `${homeTeamName} face ${awayTeamName} at ${venue}.`
        : `${homeTeamName} face ${awayTeamName}.`;

    // 2. Home Team Narrative
    let homeNarrative = "";
    if (homeStats.total >= 4) {
        if (homeStats.over25 >= 4) {
            homeNarrative = `Recent form suggests a reliable scoring tendency for the hosts, with ${homeStats.over25} of ${homeTeamName}'s last ${homeStats.total} matches producing over 2.5 goals.`;
        } else if (homeStats.under25 >= 4) {
            homeNarrative = `The hosts have been involved in relatively tight affairs recently, with ${homeStats.under25} of ${homeTeamName}'s last ${homeStats.total} matches ending under 2.5 goals.`;
        }
    }

    // 3. Away Team Narrative
    let awayNarrative = "";
    if (awayStats.total >= 4) {
        if (awayStats.over25 >= 4) {
            awayNarrative = `Similarly, ${awayTeamName} matches have consistently seen goals, with over 2.5 goals in ${awayStats.over25} of their last ${awayStats.total} outings.`;
        } else if (awayStats.under25 >= 4) {
            awayNarrative = `Conversely, ${awayTeamName} has leaned towards defensive battles, seeing under 2.5 goals in ${awayStats.under25} of their last ${awayStats.total} outings.`;
        }
    }

    // 4. H2H Narrative (Hidden because H2H logic was removed from predictions)
    let h2hNarrative = "";

    // 5. Final Prediction Waterfall Logic (Safety Net Hybrid)
    let finalPrediction = "";
    if (homeStats.total >= 4 && awayStats.total >= 4) {
        if (homeStats.over25 >= 4 && awayStats.over25 >= 4) {
            finalPrediction = "Over 1.5 Goals";
        } 
        else if (homeStats.under25 >= 4 && awayStats.under25 >= 4) {
            finalPrediction = "Under 3.5 Goals";
        }
    }

    let predictionColorClass = "text-teal-400"; // fallback just in case
    if (finalPrediction && status) {
        const isFinished = ["FT", "AET", "PEN"].includes(status);
        const isLive = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(status);
        
        if (!isFinished && !isLive) {
            predictionColorClass = "text-orange-300";
        } else if (isFinished && score && score.home !== null && score.away !== null) {
            const totalGoals = score.home + score.away;
            let isWon = false;
            let isValidTip = false;
            
            if (finalPrediction === "Over 1.5 Goals") {
                isWon = totalGoals > 1.5;
                isValidTip = true;
            } else if (finalPrediction === "Under 3.5 Goals") {
                isWon = totalGoals < 3.5;
                isValidTip = true;
            }
            
            if (isValidTip) {
                predictionColorClass = isWon ? "text-[#22c55e]" : "text-[#ef4444]";
            }
        }
    }

    const fullNarrative = [baseSentence, homeNarrative, awayNarrative, h2hNarrative].filter(Boolean).join(" ");

    return (
        <div className="bg-white/5 rounded-xl p-3 sm:p-4 shadow-sm flex items-start gap-3 mb-4 animate-in fade-in duration-500">
            <p className="text-[10px] sm:text-[11px] font-medium italic text-gray-300 leading-relaxed">
                {fullNarrative}
                {finalPrediction && (
                    <span className={`not-italic ${predictionColorClass} font-bold ml-1`}>
                        {finalPrediction}.
                    </span>
                )}
            </p>
        </div>
    );
};

export default MatchIntroduction;
