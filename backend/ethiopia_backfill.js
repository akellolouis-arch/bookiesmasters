import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Fixture from "./models/Fixture.js";
import League from "./models/League.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const BASE_URL = "https://v3.football.api-sports.io";

async function apiGetFixtures(leagueId, season) {
  const url = new URL(`${BASE_URL}/fixtures`);
  url.searchParams.set("league", String(leagueId));
  url.searchParams.set("season", String(season));

  const res = await fetch(url, { headers: { "x-apisports-key": process.env.API_KEY } });
  return await res.json();
}

async function backfillEthiopia() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // League 363 is Ethiopia Premier League
        const leagueId = 363;
        const seasonsToFetch = [2024, 2025];

        for (const season of seasonsToFetch) {
            console.log(`Fetching season ${season} for league ${leagueId}...`);
            const data = await apiGetFixtures(leagueId, season);
            
            if (data.errors && Object.keys(data.errors).length > 0) {
                console.log(`API Error:`, data.errors);
                continue;
            }

            const fixtures = data.response || [];
            console.log(`Retrieved ${fixtures.length} fixtures for season ${season}`);

            if (fixtures.length > 0) {
                const ops = fixtures.map((f) => ({
                    updateOne: {
                        filter: { fixtureId: f.fixture.id },
                        update: {
                            $set: {
                                fixtureId: f.fixture.id,
                                fixture: f,
                            },
                            $setOnInsert: {
                                prediction: null,
                                h2h: [],
                                odds: [],
                            },
                        },
                        upsert: true,
                    },
                }));
                const res = await Fixture.bulkWrite(ops, { ordered: false });
                console.log(`Upserted ${res.upsertedCount}, Modified ${res.modifiedCount}`);
            }
        }
        
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

backfillEthiopia();
