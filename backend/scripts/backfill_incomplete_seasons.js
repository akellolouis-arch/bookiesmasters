/**
 * Script to backfill ONLY leagues that have incomplete seasons.
 * This saves API quota by finding seasons that were skipped by the
 * main backfill script because they had a few upcoming fixtures
 * (but no or very few completed historical fixtures).
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import League from "../models/League.js";
import Fixture from "../models/Fixture.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({
  path: path.resolve(__dirname, "../../.env.local"),
  override: true,
});

const BASE_URL = "https://v3.football.api-sports.io";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function apiGetFixtures(leagueId, season) {
  const url = new URL(`${BASE_URL}/fixtures`);
  url.searchParams.set("league", String(leagueId));
  url.searchParams.set("season", String(season));

  let res = await fetch(url, { headers: { "x-apisports-key": process.env.API_KEY } });
  return await res.json();
}

async function upsertFixtures(fixtures) {
  if (!fixtures.length) return { upserts: 0, modified: 0 };
  const ops = fixtures.map((f) => ({
    updateOne: {
      filter: { fixtureId: f.fixture.id },
      update: {
        $set: { fixtureId: f.fixture.id, fixture: f },
        $setOnInsert: { prediction: null, h2h: [], odds: [] },
      },
      upsert: true,
    },
  }));
  const res = await Fixture.bulkWrite(ops, { ordered: false });
  return { upserts: res.upsertedCount ?? 0, modified: res.modifiedCount ?? 0 };
}

async function main() {
  const apiKey = process.env.API_KEY;
  const mongoUri = process.env.MONGO_URI;
  if (!apiKey || !mongoUri) throw new Error("API_KEY or MONGO_URI missing");

  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(mongoUri);

  const leagues = await League.find({}).lean();
  console.log(`📚 Checking ${leagues.length} saved leagues for incomplete data...`);

  let seasonsFetched = 0;

  for (const l of leagues) {
    const leagueId = Number(l?.league?.id);
    const currentSeason = Number(l?.season);
    if (!Number.isFinite(leagueId) || !Number.isFinite(currentSeason)) continue;

    const toCheck = [currentSeason - 1, currentSeason];
    let leagueHeaderPrinted = false;

    for (const season of toCheck) {
      // Get total fixtures we currently have for this season
      const totalCount = await Fixture.countDocuments({
        "fixture.league.id": leagueId,
        "fixture.league.season": season,
      });

      // If we have 0 fixtures, the regular backfill script handles it, but we can do it here too
      // The real bug is when totalCount > 0 but it's mostly unplayed matches.
      // Let's count how many are actually finished (FT, AET, PEN)
      const ftCount = await Fixture.countDocuments({
        "fixture.league.id": leagueId,
        "fixture.league.season": season,
        "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
      });

      // If a season has less than 15 completed matches, it's highly likely it was skipped
      // by the original script because of the few upcoming matches optimization.
      if (totalCount > 0 && ftCount < 15) {
        if (!leagueHeaderPrinted) {
          console.log(`\n🏟️ ${l.league.name} (${leagueId})`);
          leagueHeaderPrinted = true;
        }
        
        console.log(`  ⚠️ Season ${season} is incomplete! (Total: ${totalCount}, FT: ${ftCount})`);
        console.log(`  📦 Fetching full season ${season}...`);
        
        const data = await apiGetFixtures(leagueId, season);
        
        if (data?.errors && Object.keys(data.errors).length > 0) {
          console.log(`  ❌ API errors: ${JSON.stringify(data.errors)}`);
        } else {
          const seasonFixtures = Array.isArray(data?.response) ? data.response : [];
          console.log(`  ✅ Retrieved ${seasonFixtures.length} fixtures. Saving...`);
          const { upserts, modified } = await upsertFixtures(seasonFixtures);
          console.log(`  💾 Saved (upserted=${upserts}, modified=${modified})`);
          seasonsFetched++;
        }
        await sleep(500); // Respect API rate limits
      }
    }
  }

  console.log("\n🎉 Incomplete seasons backfill complete.");
  console.log(`- API calls made: ${seasonsFetched}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(console.error);
