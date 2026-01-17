import Fixture from "../models/Fixture.js";
import Standing from "../models/Standing.js";
import { calculateTeamForm } from "../helpers/formCalculator.js";
import { getCoordinatesForCity, calculateDistance } from "./LocationService.js";
import { getMatchWeather } from "./WeatherService.js";
import Team from "../models/Team.js";

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

        // 🧠 PREDICTION LOGIC
        // Priority: customPrediction > API Logic > null
        let calculatedTip = null;

        if (fixtureDoc.customPrediction) {
            calculatedTip = fixtureDoc.customPrediction;
        } else if (predictionData) {
            const { win_or_draw, winner } = predictionData;
            const homeName = matchData.teams.home.name;

            if (win_or_draw === true) {
                // Double Chance
                if (winner && winner.name === homeName) {
                    calculatedTip = "1X";
                } else {
                    calculatedTip = "X2";
                }
            } else {
                // Single Choice
                if (winner && winner.name === homeName) {
                    calculatedTip = "1";
                } else {
                    calculatedTip = "2";
                }
            }
        }

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

            // Predictions (Standard + API Data)
            tip: calculatedTip || "N/A", // Calculated 1X/X2/1/2 or Manual Override
            apiPrediction: predictionData || null, // Full API object for Details page (Advice, %)

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

        // Fetch Standings
        const standingsDoc = await Standing.findOne({
            "league.id": matchData.league.id,
            "league.season": matchData.league.season
        }).lean();

        // Add standings to response
        response.standings = standingsDoc ? standingsDoc.standings : [];

        // --- MATCH CONDITIONS LOGIC ---
        // Best effort: Do not fail request if this fails
        try {
            const venueCity = matchData.fixture.venue?.city;
            let conditions = {
                weather: null,
                distance: null,
                venueCity
            };

            if (venueCity) {
                // 1. Get Venue Coordinates
                // Note: In a real prod env, we should cache this city->coord map in DB to save API calls
                const venueCoords = await getCoordinatesForCity(venueCity);

                if (venueCoords) {
                    // 2. Fetch Weather
                    conditions.weather = await getMatchWeather(venueCoords.lat, venueCoords.lon, matchData.fixture.date);

                    // 3. Calculate Distance for Away Team
                    // Try to find Away Team details
                    let awayTeamDoc = await Team.findOne({ teamId: matchData.teams.away.id });
                    let awayCoords = awayTeamDoc?.coordinates;

                    // If missing coordinates, try to fetch via Stadium Name or City Name
                    if (!awayCoords) {
                        // Attempt 1: Try searching "Team Name stadium" (e.g. "Arsenal stadium")
                        const query = `${matchData.teams.away.name} stadium`;
                        const fetchedCoords = await getCoordinatesForCity(query);

                        if (fetchedCoords) {
                            awayCoords = fetchedCoords;
                            // Cache it
                            await Team.findOneAndUpdate(
                                { teamId: matchData.teams.away.id },
                                {
                                    teamId: matchData.teams.away.id,
                                    name: matchData.teams.away.name,
                                    coordinates: awayCoords
                                },
                                { upsert: true }
                            );
                        }
                    }

                    if (venueCoords && awayCoords) {
                        conditions.distance = calculateDistance(venueCoords.lat, venueCoords.lon, awayCoords.lat, awayCoords.lon);
                    }
                }
            }
            response.conditions = conditions;
        } catch (err) {
            console.error("⚠️ Error calculating match conditions:", err.message);
            response.conditions = null;
        }

        // No VIP logic anymore
        response.isVip = false;

        return response;

    } catch (error) {
        console.error("Error in getFixtureById:", error);
        throw error;
    }
};
