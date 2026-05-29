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
}

const MatchIntroduction: React.FC<MatchIntroductionProps> = ({
    homeTeamName,
    awayTeamName,
    venue,
    homeMatches = [],
    awayMatches = [],
    h2hMatches = [],
}) => {
    // Helper to calculate Over/Under 2.5 counts
    const calculateStats = (matches: MatchData[], limit: number) => {
        const recent = matches.slice(0, limit);
        let over25 = 0;
        let under25 = 0;

        recent.forEach((m) => {
            const homeGoals = m.score?.home ?? m.goals?.home;
            const awayGoals = m.score?.away ?? m.goals?.away;
            
            if (homeGoals !== undefined && homeGoals !== null && awayGoals !== undefined && awayGoals !== null) {
                if (homeGoals + awayGoals > 2.5) {
                    over25++;
                } else {
                    under25++;
                }
            }
        });

        return {
            total: over25 + under25,
            over25,
            under25,
        };
    };

    const homeStats = calculateStats(homeMatches, 9);
    const awayStats = calculateStats(awayMatches, 9);
    const h2hStats = calculateStats(h2hMatches, 9);

    // 1. Base Sentence
    const baseSentence = venue && venue.trim() !== "" && venue !== "Unknown venue"
        ? `${homeTeamName} faces ${awayTeamName} at ${venue}.`
        : `${homeTeamName} faces ${awayTeamName}.`;

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

    const fullNarrative = [baseSentence, homeNarrative, awayNarrative, h2hNarrative].filter(Boolean).join(" ");

    return (
        <div className="bg-[#1a1a1a] border-l-4 border-emerald-500/50 p-4 rounded-r-lg mb-4 animate-in fade-in duration-500">
            <p className="text-gray-300 text-sm leading-relaxed font-medium">
                {fullNarrative}
            </p>
        </div>
    );
};

export default MatchIntroduction;
