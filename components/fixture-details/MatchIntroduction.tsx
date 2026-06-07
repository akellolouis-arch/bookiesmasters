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
    if (homeStats.total > 0) {
        if (homeStats.over25 >= homeStats.under25) {
            homeNarrative = `Recent form suggests a high-scoring tendency for the hosts, with ${homeStats.over25} of ${homeTeamName}'s last ${homeStats.total} matches producing over 2.5 goals.`;
        } else {
            homeNarrative = `The hosts have been involved in tight affairs recently, with ${homeStats.under25} of ${homeTeamName}'s last ${homeStats.total} matches ending under 2.5 goals.`;
        }
    }

    // 3. Away Team Narrative
    let awayNarrative = "";
    if (awayStats.total > 0) {
        if (awayStats.over25 >= awayStats.under25) {
            awayNarrative = `Similarly, ${awayTeamName} matches have been full of goals, seeing over 2.5 goals in ${awayStats.over25} of their last ${awayStats.total} outings.`;
        } else {
            awayNarrative = `Conversely, ${awayTeamName} has leaned towards defensive battles, seeing under 2.5 goals in ${awayStats.under25} of their last ${awayStats.total} outings.`;
        }
    }

    // 4. H2H Narrative
    let h2hNarrative = "";
    if (h2hStats.total > 0) {
        if (h2hStats.over25 >= h2hStats.under25) {
            h2hNarrative = `When these two sides meet, history favors attackers—${h2hStats.over25} of their last ${h2hStats.total} head-to-head encounters have crossed the over 2.5 goal mark.`;
        } else {
            h2hNarrative = `Historically, this matchup is tightly contested; ${h2hStats.under25} of their last ${h2hStats.total} head-to-head meetings have stayed under 2.5 goals.`;
        }
    }

    // 5. Final Prediction Waterfall Logic (Safety Net Hybrid)
    let finalPrediction = "";
    if (homeStats.total > 0 && awayStats.total > 0 && h2hStats.total > 0) {
        // Safety Net Over: Predict OV1.5 only when the harder OV2.5 test passes
        if (homeStats.over25 >= homeStats.under25 && awayStats.over25 >= awayStats.under25 && h2hStats.over25 >= h2hStats.under25) {
            finalPrediction = "Over 1.5 Goals";
        } 
        // Safety Net Under: Predict UN3.5 only when the harder UN2.5 test passes
        else if (homeStats.under25 >= homeStats.over25 && awayStats.under25 >= awayStats.over25 && h2hStats.under25 >= h2hStats.over25) {
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
            <p className="text-[11px] sm:text-xs font-medium italic text-gray-300 leading-relaxed">
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
