import Fixture from "../models/Fixture.js";
import Standing from "../models/Standing.js";
import { calculateTeamForm } from "../helpers/formCalculator.js";



console.log("✅ FixtureService Loaded with AllMatches Logic");

export const getFixtureById = async (fixtureId) => {
    try {
        const fixtureIdNum = Number(fixtureId);

        // Find custom Fixture document
        // console.log(`🔎 Querying DB for ID: ${fixtureIdNum}`);
        const fixtureDoc = await Fixture.findOne({
            $or: [
                { fixtureId: fixtureIdNum },
                { "fixture.fixture.id": fixtureIdNum },
            ],
        }).lean();

        if (!fixtureDoc) {
            console.log("❌ DB Query returned null");
            return null;
        }

        const matchData = fixtureDoc.fixture;

        // Safety Check: Ensure critical data exists
        if (!matchData || !matchData.teams || !matchData.league) {
            console.log("❌ Fixture missing critical data (teams/league)");
            return null;
        }

        // Use the root 'h2h' field as requested, which stores the H2H data from API
        const h2hData = fixtureDoc.h2h || [];

        // Calculate Form for Home/Away (Safe Mode)
        let homeData = { form: [], last5Matches: [] };
        let awayData = { form: [], last5Matches: [] };

        try {
            // Parallel execution for improvements
            [homeData, awayData] = await Promise.all([
                calculateTeamForm(matchData.teams.home.id).catch((e) => { console.error("Home Form Error:", e); return homeData; }),
                calculateTeamForm(matchData.teams.away.id).catch((e) => { console.error("Away Form Error:", e); return awayData; })
            ]);

        } catch (err) {
            // Continue with empty form data
            console.error("Error fetching ancillary stats:", err);
        }

        // Prepare Response Object matching frontend expectations
        // Logic adapted from prev/helpers/predictionMerger.js

        // 🧠 PREDICTION LOGIC DELETED (Per user request)

        // 🔥 LIVE DATA CHECK
        const live = fixtureDoc.livescore;

        // Priority: Use Live data if available
        let currentStatus = live?.status || matchData.fixture?.status || { short: "NS", elapsed: null };
        let currentGoals = live?.goals || matchData.goals || { home: null, away: null };

        // 🛡️ SAFETY FIX: If main status is "NS" (Not Started) or "TBD", IGNORE any stale livescore data
        // This prevents future games from showing as "HT" or "FT" due to bad caching
        if (matchData.fixture?.status?.short === "NS" || matchData.fixture?.status?.short === "TBD") {
            currentStatus = matchData.fixture.status;
            currentGoals = { home: null, away: null };
        }

        const isFinished = ["FT", "AET", "PEN"].includes(currentStatus.short);
        const isLive = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(currentStatus.short);

        // Calculate "Display Date" or "Time"
        let displayDate = "";

        if (isFinished) {
            displayDate = "FT";
        } else if (isLive) {
            displayDate = currentStatus.elapsed ? `${currentStatus.elapsed}'` : "Live";
        } else {
            // Not started
            const fDate = matchData.fixture?.date;
            displayDate = fDate ? new Date(fDate).toLocaleString("en-GB", {
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Africa/Nairobi",
            }) : "TBD";
        }

        // Format Score
        let score = null;
        if ((isLive || isFinished) && currentGoals?.home !== null) {
            score = {
                home: currentGoals.home,
                away: currentGoals.away,
                halftime: live?.score?.halftime || matchData.score?.halftime || null
            };
        }

        const response = {
            fixtureId: matchData.fixture.id,
            leagueId: matchData.league.id,
            league: matchData.league.name,
            leagueLogo: matchData.league.logo,
            country: matchData.league.country,
            date: matchData.fixture.date,
            displayDate,
            score, // { home: 1, away: 2 } or null
            status: currentStatus.short || "NS",
            venue: matchData.fixture.venue?.name || "Unknown venue",

            // Predictions and Tips removed per user request

            // DEBUG: Log counts
            // console.log(`[FixtureService] Home Matches: ${homeData.allMatches?.length}, Away Matches: ${awayData.allMatches?.length}`);

            homeTeam: {
                id: matchData.teams.home.id,
                name: matchData.teams.home.name,
                logo: matchData.teams.home.logo,
                form: homeData.form,
                last5Matches: homeData.last5Matches,
                allMatches: homeData.allMatches || [], // Full history (20)
            },

            awayTeam: {
                id: matchData.teams.away.id,
                name: matchData.teams.away.name,
                logo: matchData.teams.away.logo,
                form: awayData.form,
                last5Matches: awayData.last5Matches,
                allMatches: awayData.allMatches || [], // Full history (20)
            },



            h2h: h2hData,

            // Odds removed per user request

            // Rich Data
            lineups: fixtureDoc.lineups || matchData.lineups || [],
            injuries: fixtureDoc.injuries || [],
            statistics: fixtureDoc.statistics || [],
            events: fixtureDoc.events || matchData.events || [],
        };



        // Fetch Standings
        const standingsDoc = await Standing.findOne({
            "league.id": matchData.league.id,
            "league.season": matchData.league.season
        }).lean();

        // Add standings to response
        response.standings = standingsDoc ? standingsDoc.standings : [];

        // No VIP logic anymore
        response.isVip = false;

        return response;

    } catch (error) {
        console.error("Error in getFixtureById:", error);
        throw error;
    }
};
