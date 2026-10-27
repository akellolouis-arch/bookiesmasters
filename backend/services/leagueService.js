import mongoose from "mongoose";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import Fixture from "../models/Fixture.js";
import Standing from "../models/Standing.js";
import League from "../models/League.js";
import TopScorer from "../models/TopScorer.js";
import { getLeagueStandings } from "./fixtureService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const getLeagueTopScorers = async (leagueId, season) => {
    const leagueIdNum = Number(leagueId);
    const seasonNum = Number(season) || new Date().getFullYear();

    if (!leagueIdNum) return [];

    try {
        // 1. Check MongoDB cache first
        const cached = await TopScorer.findOne({
            leagueId: leagueIdNum,
            season: seasonNum,
        }).lean();

        const TWELVE_HOURS = 12 * 60 * 60 * 1000;
        const isFresh = cached && cached.lastUpdated && (Date.now() - new Date(cached.lastUpdated).getTime() < TWELVE_HOURS);

        if (isFresh && cached.scorers && cached.scorers.length > 0) {
            return cached.scorers;
        }

        // 2. Fetch on-demand from API-Football if cache missing or expired
        if (process.env.API_KEY) {
            try {
                const apiRes = await axios.get("https://v3.football.api-sports.io/players/topscorers", {
                    params: {
                        league: leagueIdNum,
                        season: seasonNum,
                    },
                    headers: { "x-apisports-key": process.env.API_KEY },
                    timeout: 5000,
                });

                const rawList = apiRes.data?.response || [];
                if (rawList.length > 0) {
                    const formatted = rawList.map((item, idx) => ({
                        rank: idx + 1,
                        player: {
                            id: item.player?.id,
                            name: item.player?.name,
                            firstname: item.player?.firstname,
                            lastname: item.player?.lastname,
                            photo: item.player?.photo,
                            nationality: item.player?.nationality,
                        },
                        team: {
                            id: item.statistics?.[0]?.team?.id,
                            name: item.statistics?.[0]?.team?.name,
                            logo: item.statistics?.[0]?.team?.logo,
                        },
                        goals: item.statistics?.[0]?.goals?.total || 0,
                        assists: item.statistics?.[0]?.goals?.assists || 0,
                        appearances: item.statistics?.[0]?.games?.appearences || 0,
                        minutes: item.statistics?.[0]?.games?.minutes || 0,
                        penalties: item.statistics?.[0]?.penalty?.scored || 0,
                        rating: item.statistics?.[0]?.games?.rating || null,
                    }));

                    await TopScorer.findOneAndUpdate(
                        { leagueId: leagueIdNum, season: seasonNum },
                        {
                            leagueId: leagueIdNum,
                            season: seasonNum,
                            scorers: formatted,
                            lastUpdated: new Date(),
                        },
                        { upsert: true }
                    );

                    return formatted;
                }
            } catch (apiErr) {
                console.warn(`[TopScorers] API fetch failed for league ${leagueIdNum}:`, apiErr.message);
            }
        }

        // 3. Fallback: return stale cache or previous season in DB if available
        if (cached && cached.scorers && cached.scorers.length > 0) {
            return cached.scorers;
        }

        const fallback = await TopScorer.findOne({
            leagueId: leagueIdNum,
            "scorers.0": { $exists: true },
        }).sort({ season: -1 }).lean();

        if (fallback && fallback.scorers) {
            return fallback.scorers;
        }

        return [];
    } catch (err) {
        console.error(`[TopScorers] Error for league ${leagueId}:`, err);
        return [];
    }
};

export const getLeagueDetails = async (leagueId) => {
    const leagueIdNum = Number(leagueId);
    if (!leagueIdNum) return null;

    try {
        // 1. Resolve League Metadata
        let leagueInfo = null;

        // Try from Standing first (most complete league metadata: id, name, country, logo, flag, season)
        const standingDoc = await Standing.findOne({ "league.id": leagueIdNum })
            .sort({ "league.season": -1 })
            .lean();

        if (standingDoc && standingDoc.league) {
            leagueInfo = {
                id: standingDoc.league.id,
                name: standingDoc.league.name,
                country: standingDoc.league.country,
                logo: standingDoc.league.logo,
                flag: standingDoc.league.flag,
                season: standingDoc.league.season,
            };
        }

        // Fallback: check recent fixture
        if (!leagueInfo) {
            const fixtureDoc = await Fixture.findOne({ "fixture.league.id": leagueIdNum })
                .sort({ "fixture.fixture.date": -1 })
                .lean();

            if (fixtureDoc?.fixture?.league) {
                const fl = fixtureDoc.fixture.league;
                leagueInfo = {
                    id: fl.id,
                    name: fl.name,
                    country: fl.country,
                    logo: fl.logo,
                    flag: fl.flag,
                    season: fl.season,
                };
            }
        }

        // Fallback: check League collection
        if (!leagueInfo) {
            const leagueDoc = await League.findOne({ "league.id": leagueIdNum }).lean();
            if (leagueDoc && leagueDoc.league) {
                leagueInfo = {
                    id: leagueDoc.league.id,
                    name: leagueDoc.league.name,
                    country: leagueDoc.country?.name,
                    logo: leagueDoc.league.logo,
                    flag: leagueDoc.country?.flag,
                    season: leagueDoc.season,
                };
            }
        }

        if (!leagueInfo) {
            console.log(`❌ League ${leagueIdNum} not found in DB`);
            return null;
        }

        const season = leagueInfo.season || new Date().getFullYear();

        // 2. Resolve Standings & Top Scorers in parallel
        const [standings, topScorers] = await Promise.all([
            getLeagueStandings(leagueIdNum, season, leagueInfo.name),
            getLeagueTopScorers(leagueIdNum, season),
        ]);

        // 3. Resolve Fixtures for this league (Upcoming & Recent Results)
        const nowIso = new Date().toISOString();
        const startOfTodayIso = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

        const [upcomingFixturesRaw, recentResultsRaw] = await Promise.all([
            // Upcoming or today's matches
            Fixture.find({
                "fixture.league.id": leagueIdNum,
                "fixture.fixture.date": { $gte: startOfTodayIso },
            })
                .sort({ "fixture.fixture.date": 1 })
                .limit(30)
                .lean(),

            // Finished recent results
            Fixture.find({
                "fixture.league.id": leagueIdNum,
                $or: [
                    { "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] } },
                    { "fixture.fixture.date": { $lt: startOfTodayIso } },
                ],
            })
                .sort({ "fixture.fixture.date": -1 })
                .limit(30)
                .lean(),
        ]);

        const formatLeagueFixture = (f) => {
            const m = f.fixture || {};
            const fix = m.fixture || {};
            const teams = m.teams || {};
            const goals = f.livescore?.goals || m.goals || { home: null, away: null };
            const statusObj = f.livescore?.status || fix.status || { short: "NS" };

            let score = null;
            if (goals.home !== null && goals.away !== null) {
                score = `${goals.home} - ${goals.away}`;
            }

            return {
                fixtureId: f.fixtureId || fix.id,
                date: fix.date,
                status: statusObj.short || "NS",
                elapsed: statusObj.elapsed || null,
                round: m.league?.round || null,
                venue: fix.venue?.name || null,
                homeTeam: {
                    id: teams.home?.id,
                    name: teams.home?.name,
                    logo: teams.home?.logo,
                },
                awayTeam: {
                    id: teams.away?.id,
                    name: teams.away?.name,
                    logo: teams.away?.logo,
                },
                score,
                predictionTip: f.predictionTip && f.predictionTip !== "NONE" ? f.predictionTip : null,
                customPrediction: f.customPrediction || null,
            };
        };

        const upcomingFixtures = upcomingFixturesRaw.map(formatLeagueFixture);
        const recentResults = recentResultsRaw.map(formatLeagueFixture);

        return {
            league: leagueInfo,
            standings: standings || [],
            topScorers: topScorers || [],
            upcomingFixtures,
            recentResults,
        };

    } catch (error) {
        console.error(`Error in getLeagueDetails for ${leagueId}:`, error);
        throw error;
    }
};

