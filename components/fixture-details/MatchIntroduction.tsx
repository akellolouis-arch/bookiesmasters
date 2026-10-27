import React from 'react';

interface MatchData {
    homeTeam?: { name?: string; id?: number };
    awayTeam?: { name?: string; id?: number };
    score?: { home?: number | null; away?: number | null };
    goals?: { home?: number | null; away?: number | null };
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
    const calculateFormAndStats = (matches: MatchData[] = [], limit: number, teamName: string) => {
        if (!Array.isArray(matches)) {
            return { total: 0, wins: 0, losses: 0, draws: 0, over15: 0, under15: 0, over25: 0, under25: 0, over35: 0, under35: 0, btts: 0 };
        }
        const recent = matches.slice(0, limit);
        let total = 0;
        let wins = 0, losses = 0, draws = 0;
        let over15 = 0, under15 = 0;
        let over25 = 0, under25 = 0;
        let over35 = 0, under35 = 0;
        let btts = 0;

        recent.forEach((m) => {
            if (!m) return;
            const hGoals = m.score?.home ?? m.goals?.home;
            const aGoals = m.score?.away ?? m.goals?.away;
            
            if (hGoals !== undefined && hGoals !== null && aGoals !== undefined && aGoals !== null) {
                total++;
                const tg = hGoals + aGoals;
                if (tg > 1.5) over15++; else under15++;
                if (tg > 2.5) over25++; else under25++;
                if (tg > 3.5) over35++; else under35++;
                if (hGoals > 0 && aGoals > 0) btts++;

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
    const safeTip = (computedTip || "").toString();
    const displayTip = safeTip.replace(" Goals", "");

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
        narrative = `${homeTeamName} has seen under 3.5 goals in ${homeStats.under35} of their last ${homeStats.total} matches, while ${awayTeamName} has seen under 3.5 goals in ${awayStats.under35} of their last ${awayStats.total} matches.`;
    } else if (displayTip === "OV1.5" || displayTip === "Over 1.5") {
        narrative = `${homeTeamName} has seen over 1.5 goals in ${homeStats.over15} of their last ${homeStats.total} matches, while ${awayTeamName} has seen over 1.5 goals in ${awayStats.over15} of their last ${awayStats.total} matches.`;
    } else {
        if (homeStats.wins > awayStats.wins && homeStats.wins >= 3) {
            narrative = `${homeTeamName} enters in stronger recent form, picking up ${homeStats.wins} wins in their last 5 fixtures compared to ${awayTeamName}'s ${awayStats.wins}.`;
        } else if (awayStats.wins > homeStats.wins && awayStats.wins >= 3) {
            narrative = `${awayTeamName} heads into this clash in confident form, securing ${awayStats.wins} victories in their last 5 outings compared to ${homeTeamName}'s ${homeStats.wins}.`;
        } else if (homeStats.btts >= 3 || awayStats.btts >= 3) {
            narrative = `Recent patterns suggest lively goalmouth action, with both teams frequently getting on the scoresheet in their respective recent schedules.`;
        } else {
            narrative = `Both sides will be keen to impose their tactical style and claim vital points in this evenly balanced encounter.`;
        }
    }

    // 3. Status/Live/Finished Dynamic Hook
    let statusHook = "";
    if (status === "FT" || status === "AET" || status === "PEN") {
        if (score && score.home !== null && score.away !== null) {
            statusHook = ` This fixture concluded with a final score of ${score.home} - ${score.away}.`;
        } else {
            statusHook = ` This match has concluded.`;
        }
    } else if (["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(status || "")) {
        if (score && score.home !== null && score.away !== null) {
            statusHook = ` Match is currently live (${score.home} - ${score.away}).`;
        } else {
            statusHook = ` Match is currently underway.`;
        }
    }

    return (
        <div className={`w-full ${bg} ${rounded} ${padding} ${margin} border border-gray-200 shadow-xs animate-in fade-in duration-300`}>
            <p className="text-[11px] sm:text-[12px] text-gray-700 leading-relaxed font-normal">
                <span className="font-semibold text-gray-900">{baseSentence}</span>{" "}
                <span>{narrative}</span>
                {statusHook && <span className="font-medium text-teal-800">{statusHook}</span>}
            </p>
        </div>
    );
};

export default MatchIntroduction;
