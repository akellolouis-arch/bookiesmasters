import React from 'react';

interface MatchData {
    homeTeam?: { name: string; id: number };
    awayTeam?: { name: string; id: number };
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
    computedTip?: string;
    rounded?: string;
    bg?: string;
    padding?: string;
    margin?: string;
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
    computedTip = "",
    rounded = "rounded-xl",
    bg = "bg-gray-100",
    padding = "p-2 sm:p-3",
    margin = "mb-2"
}) => {
    const calculateFormAndStats = (matches: MatchData[], limit: number, teamName: string) => {
        const recent = matches.slice(0, limit);
        let total = 0;
        let wins = 0, losses = 0, draws = 0;
        let over15 = 0, under15 = 0;
        let over25 = 0, under25 = 0;
        let over35 = 0, under35 = 0;
        let btts = 0;

        recent.forEach((m) => {
            const hGoals = m.score?.home ?? m.goals?.home;
            const aGoals = m.score?.away ?? m.goals?.away;
            
            if (hGoals !== undefined && hGoals !== null && aGoals !== undefined && aGoals !== null) {
                total++;
                const tg = hGoals + aGoals;
                if (tg > 1.5) over15++; else under15++;
                if (tg > 2.5) over25++; else under25++;
                if (tg > 3.5) over35++; else under35++;
                if (hGoals > 0 && aGoals > 0) btts++;

                // If m.homeTeam is undefined, it might be an older/simpler data format where we can't reliably determine wins/losses.
                if (m.homeTeam?.name === teamName) {
                    if (hGoals > aGoals) wins++;
                    else if (hGoals < aGoals) losses++;
                    else draws++;
                } else if (m.awayTeam?.name === teamName) {
                    if (aGoals > hGoals) wins++;
                    else if (aGoals < hGoals) losses++;
                    else draws++;
                }
            }
        });

        return { total, wins, losses, draws, over15, under15, over25, under25, over35, under35, btts };
    };

    const homeStats = calculateFormAndStats(homeMatches, 5, homeTeamName);
    const awayStats = calculateFormAndStats(awayMatches, 5, awayTeamName);

    // 1. Base Sentence
    const baseSentence = venue && venue.trim() !== "" && venue !== "Unknown venue"
        ? `${homeTeamName} face ${awayTeamName} at ${venue}.`
        : `${homeTeamName} face ${awayTeamName}.`;

    // 2. Logic-Driven Narrative
    let narrative = "";
    const displayTip = computedTip.replace(" Goals", "");

    if (displayTip === "1" || displayTip === "HOME WIN") {
        narrative = `${homeTeamName} has won ${homeStats.wins} of their last ${homeStats.total} matches, while ${awayTeamName} has lost ${awayStats.losses} of their last ${awayStats.total} matches.`;
    } else if (displayTip === "2" || displayTip === "AWAY WIN") {
        narrative = `${awayTeamName} has won ${awayStats.wins} of their last ${awayStats.total} matches, while ${homeTeamName} has lost ${homeStats.losses} of their last ${homeStats.total} matches.`;
    } else if (displayTip === "UN2.5" || displayTip === "Under 2.5") {
        narrative = `${homeTeamName} has seen under 1.5 goals in ${homeStats.under15} of their last ${homeStats.total} matches, while ${awayTeamName} has seen under 1.5 goals in ${awayStats.under15} of their last ${awayStats.total} matches.`;
    } else if (displayTip === "OV2.5" || displayTip === "Over 2.5") {
        narrative = `${homeTeamName} has seen over 3.5 goals in ${homeStats.over35} of their last ${homeStats.total} matches, while ${awayTeamName} has seen over 3.5 goals in ${awayStats.over35} of their last ${awayStats.total} matches.`;
    } else if (displayTip === "BTTS" || displayTip === "GG") {
        narrative = `${homeTeamName} has seen both teams score and over 2.5 goals in ${Math.min(homeStats.btts, homeStats.over25)} of their last ${homeStats.total} matches, while ${awayTeamName} has seen both teams score and over 2.5 goals in ${Math.min(awayStats.btts, awayStats.over25)} of their last ${awayStats.total} matches.`;
    } else if (displayTip === "UN3.5" || displayTip === "Under 3.5") {
        narrative = `${homeTeamName} has seen under 2.5 goals in ${homeStats.under25} of their last ${homeStats.total} matches, while ${awayTeamName} has seen under 2.5 goals in ${awayStats.under25} of their last ${awayStats.total} matches.`;
    } else if (displayTip === "OV1.5" || displayTip === "Over 1.5") {
        narrative = `${homeTeamName} has seen over 2.5 goals in ${homeStats.over25} of their last ${homeStats.total} matches, while ${awayTeamName} has seen over 2.5 goals in ${awayStats.over25} of their last ${awayStats.total} matches.`;
    } else {
        if (homeStats.total > 0) {
            narrative = `This matchup will test both teams' recent form, as ${homeTeamName} and ${awayTeamName} look to establish dominance.`;
        }
    }

    let formattedTip = computedTip;
    if (computedTip === "1") formattedTip = "HOME WIN";
    else if (computedTip === "2") formattedTip = "AWAY WIN";
    else if (computedTip === "UN2.5") formattedTip = "UNDER 2.5 GOALS";
    else if (computedTip === "OV2.5") formattedTip = "OVER 2.5 GOALS";
    else if (computedTip === "UN3.5") formattedTip = "UNDER 3.5 GOALS";
    else if (computedTip === "OV1.5") formattedTip = "OVER 1.5 GOALS";

    // 3. Color Logic for the UI
    let predictionColorClass = "text-teal-400"; // fallback
    if (computedTip && status) {
        const isFinished = ["FT", "AET", "PEN"].includes(status);
        const isLive = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(status);
        
        if (!isFinished && !isLive) {
            predictionColorClass = "text-orange-300";
        } else if (isFinished && score && score.home !== null && score.away !== null) {
            const totalGoals = score.home + score.away;
            let isWon = false;
            let isValidTip = false;
            
            if (displayTip === "OV1.5" || displayTip === "Over 1.5") {
                isWon = totalGoals > 1.5;
                isValidTip = true;
            } else if (displayTip === "UN3.5" || displayTip === "Under 3.5") {
                isWon = totalGoals < 3.5;
                isValidTip = true;
            } else if (displayTip === "OV2.5" || displayTip === "Over 2.5") {
                isWon = totalGoals > 2.5;
                isValidTip = true;
            } else if (displayTip === "UN2.5" || displayTip === "Under 2.5") {
                isWon = totalGoals < 2.5;
                isValidTip = true;
            } else if (displayTip === "BTTS" || displayTip === "GG") {
                isWon = score.home > 0 && score.away > 0;
                isValidTip = true;
            } else if (displayTip === "1" || displayTip === "HOME WIN") {
                isWon = score.home > score.away;
                isValidTip = true;
            } else if (displayTip === "2" || displayTip === "AWAY WIN") {
                isWon = score.away > score.home;
                isValidTip = true;
            }
            
            if (isValidTip) {
                predictionColorClass = isWon ? "text-[#22c55e]" : "text-[#ef4444]";
            }
        }
    }

    const fullNarrative = [baseSentence, narrative].filter(Boolean).join(" ");

    return (
        <div className={`${bg} ${rounded} ${padding} ${margin} shadow-sm flex items-start gap-2 animate-in fade-in duration-500`}>
            <p className="text-[11px] sm:text-[12px] font-medium text-gray-700 leading-relaxed text-justify">
                {fullNarrative}
                {formattedTip && (
                    <span className={`${predictionColorClass} font-bold ml-1`}>
                        {formattedTip}
                    </span>
                )}
            </p>
        </div>
    );
};

export default MatchIntroduction;
