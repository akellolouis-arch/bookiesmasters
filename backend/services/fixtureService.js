import Fixture from "../models/Fixture.js";
import VipFixture from "../models/VipFixture.js";
import Standing from "../models/Standing.js";
import { calculateTeamForm } from "../helpers/formCalculator.js";

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
        const predictionData = fixtureDoc.prediction; // Embedded prediction

        // Use the root 'h2h' field as requested, which stores the H2H data from API
        const h2hData = fixtureDoc.h2h || [];

        // Calculate Form for Home/Away (Safe Mode)
        let homeData = { form: [], last5Matches: [] };
        let awayData = { form: [], last5Matches: [] };

        try {
            homeData = await calculateTeamForm(matchData.teams.home.id) || homeData;
            awayData = await calculateTeamForm(matchData.teams.away.id) || awayData;
        } catch (err) {
            // Continue with empty form data
        }

        // Prepare Response Object matching frontend expectations
        // Logic adapted from prev/helpers/predictionMerger.js

        // 🔥 LIVE DATA CHECK
        const live = fixtureDoc.livescore;

        // Priority: Use Live data if available
        const currentStatus = live?.status || matchData.fixture.status;
        const currentGoals = live?.goals || matchData.goals;

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
            displayDate = new Date(matchData.fixture.date).toLocaleString("en-GB", {
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Africa/Nairobi",
            });
        }

        // Format Score
        let score = null;
        if ((isLive || isFinished) && currentGoals?.home !== null) {
            score = {
                home: currentGoals.home,
                away: currentGoals.away
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

            // Predictions (optional, kept if needed later or for reference)
            tip: predictionData?.predictions?.advice || "N/A",

            homeTeam: {
                id: matchData.teams.home.id,
                name: matchData.teams.home.name,
                logo: matchData.teams.home.logo,
                form: homeData.form,
                last5Matches: homeData.last5Matches,
            },

            awayTeam: {
                id: matchData.teams.away.id,
                name: matchData.teams.away.name,
                logo: matchData.teams.away.logo,
                form: awayData.form,
                last5Matches: awayData.last5Matches,
            },

            h2h: h2hData,

            // LOGIC: If match is LIVE (or finished recently/HT) AND we have liveOdds, use them.
            // Otherwise use pre-match odds.
            odds: fixtureDoc.odds || [],

            // Events (Goals, Cards, Subs)
            events: matchData.events || [],

            // Rich Data
            lineups: fixtureDoc.lineups || [],
            injuries: fixtureDoc.injuries || [],
            statistics: fixtureDoc.statistics || [],
        };

        // Fetch VipFixture Data (Safe separate query)
        const vipDoc = await VipFixture.findOne({ fixtureId: fixtureIdNum }).lean();

        // Fetch Standings
        const standingsDoc = await Standing.findOne({
            "league.id": matchData.league.id,
            "league.season": matchData.league.season
        }).lean();

        // Add standings to response
        response.standings = standingsDoc ? standingsDoc.standings : [];

        // MERGE VIP DATA
        if (vipDoc) {
            response.isVip = true;
            response.creditCost = vipDoc.creditCost || 0;
            response.prediction = vipDoc.prediction; // Override standard prediction
            response.customOdds = vipDoc.customOdds;
            response.tip = vipDoc.prediction; // Ensure tip field reflects VIP prediction
        } else {
            response.isVip = false;
        }

        return response;

    } catch (error) {
        console.error("Error in getFixtureById:", error);
        throw error;
    }
};
