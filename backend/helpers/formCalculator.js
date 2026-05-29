
import Fixture from "../models/Fixture.js";

export const calculateTeamForm = async (teamId) => {
    // Queries adapted for nested 'fixture' object in current schema
    const fixtures = await Fixture.find({
        $or: [
            { "fixture.teams.home.id": teamId },
            { "fixture.teams.away.id": teamId },
        ],
        "fixture.fixture.status.short": "FT", // Only completed matches
    })
        .sort({ "fixture.fixture.date": -1 }) // Sort by nested date
        .limit(20); // Fetch 20 for "Show More" functionality

    console.log(`[FormCalc] Found ${fixtures.length} matches for team ${teamId}`);

    const form = [];
    const allMatches = [];

    fixtures.forEach((doc, index) => {
        // Access nested data
        const match = doc.fixture;

        // In current schema, 'match' contains { fixture, league, teams, goals, score, ... }
        if (!match || !match.teams || !match.teams.home || !match.teams.away || !match.goals) return;

        const isHome = match.teams.home.id === teamId;
        const teamGoals = isHome ? match.goals.home : match.goals.away;
        const oppGoals = isHome ? match.goals.away : match.goals.home;

        // Determine Result
        let result, color;
        if (teamGoals > oppGoals) {
            result = "W";
            color = "#16a34a"; // green-600
        } else if (teamGoals < oppGoals) {
            result = "L";
            color = "#dc2626"; // red-600
        } else {
            result = "D";
            color = "#eab308"; // yellow-500
        }

        // Store result for form summary (ONLY for first 5)
        if (index < 5) {
            form.push({ result, color });
        }

        // Store detailed match info
        allMatches.push({
            date: match.fixture.date,
            homeTeam: {
                id: match.teams.home.id,
                name: match.teams.home.name,
                logo: match.teams.home.logo,
            },
            awayTeam: {
                id: match.teams.away.id,
                name: match.teams.away.name,
                logo: match.teams.away.logo,
            },
            score: {
                home: match.goals.home,
                away: match.goals.away,
                halftime: match.score?.halftime || null,
            },
            league: match.league ? {
                id: match.league.id,
                name: match.league.name,
                logo: match.league.logo
            } : null,
            venue: match.fixture?.venue?.name || "Unknown venue",
            result, // W/D/L from current team's perspective
            color,
        });
    });

    console.log(`[FormCalc] Processed ${allMatches.length} valid matches for team ${teamId}`);

    // Valid check: form is strictly last 5
    // last5Matches property is kept for backward compatibility if needed, 
    // or we can update service to use 'allMatches'. 
    // Let's return both to be safe: 'last5Matches' (sliced) and 'allMatches' (full)

    return {
        form,
        last5Matches: allMatches.slice(0, 5),
        allMatches
    };
};
