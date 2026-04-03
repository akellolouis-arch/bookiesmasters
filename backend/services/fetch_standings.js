import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

import League from "../models/League.js";
import Standing from "../models/Standing.js";

import { fileURLToPath } from "url";
import {
  applyMongoDnsHints,
  getMongoClientOptions,
} from "../mongoConnectOptions.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const api = axios.create({
    baseURL: "https://v3.football.api-sports.io",
    headers: {
        "x-apisports-key": process.env.API_KEY
    }
});

async function getSavedLeagues() {
    const leagues = await League.find({});
    return leagues.map(l => ({
        id: l.league.id,
        name: l.league.name,
        currentSeason: l.season
    }));
}

async function fetchLeagueStandings(leagueId, season) {
    try {
        const res = await api.get("/standings", {
            params: {
                league: leagueId,
                season: season
            }
        });

        // Response structure: { response: [ { league: { id, name, ..., standings: [...] } } ] }
        return res.data?.response?.[0]?.league || null;
    } catch (err) {
        console.error(`⚠ Error fetching standings for league ${leagueId}:`, err.message);
        return null;
    }
}

export async function updateStandings(standalone = true, targetLeagues = null) {
    try {
        if (standalone) {
            applyMongoDnsHints();
            await mongoose.connect(
                process.env.MONGO_URI,
                getMongoClientOptions()
            );
            console.log("✅ Connected to MongoDB");
        }

        let leaguesToUpdate = await getSavedLeagues();
        if (!leaguesToUpdate.length) {
            console.log("⚠ No saved leagues found in DB.");
            return;
        }

        // Filter if specific targets provided
        if (targetLeagues && targetLeagues.length > 0) {
            leaguesToUpdate = leaguesToUpdate.filter(l => targetLeagues.includes(l.id));
        }

        if (leaguesToUpdate.length === 0) {
            // console.log("   ℹ No active league standings to update.");
            return;
        }

        console.log(`Checking standings for ${leaguesToUpdate.length} leagues...`);

        for (const l of leaguesToUpdate) {
            if (!l.currentSeason) continue;

            // console.log(`\nFetching standings: ${l.name} (${l.id}) - Season ${l.currentSeason}`);
            const leagueData = await fetchLeagueStandings(l.id, l.currentSeason);

            if (leagueData) {
                await Standing.findOneAndUpdate(
                    { "league.id": l.id, "league.season": l.currentSeason },
                    {
                        league: {
                            id: leagueData.id,
                            name: leagueData.name,
                            country: leagueData.country,
                            logo: leagueData.logo,
                            flag: leagueData.flag,
                            season: leagueData.season
                        },
                        standings: leagueData.standings
                    },
                    { upsert: true }
                );

                const isGrouped = leagueData.standings.length > 1;
                // const groups = isGrouped ? leagueData.standings.map(g => g[0]?.group).filter(Boolean) : ["Single Table"];

                // console.log(`   ✔ Saved Standings for ${l.name}`);
            } else {
                // console.log(`   ⚠ No standings data available for ${l.name}`);
            }
        }

        console.log("🎉 Finished fetching standings.");

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        if (standalone) {
            await mongoose.disconnect();
        }
    }
}

// Support legacy run() name if referenced elsewhere or rename usages? 
// Actually let's just use updateStandings.
// And check if we need to call it at the bottom.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    updateStandings(true);
}
