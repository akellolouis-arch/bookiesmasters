/**
 * Backfill fixtures for current + previous season for saved leagues.
 *
 * Behavior:
 * - Deletes ALL saved fixtures first.
 * - Fetches BOTH seasons (previous + current) for all saved leagues via API-Football GET /fixtures?league=&season=
 * - After backfill, enforces that only those two seasons exist for saved leagues.
 *
 * Usage:
 *   node backend/scripts/backfill_fixtures_two_seasons.js --yes
 *
 * Requires:
 * - backend/.env with API_KEY and MONGO_URI
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

import League from "../models/League.js";
import Fixture from "../models/Fixture.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const BASE_URL = "https://v3.football.api-sports.io";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function apiGetFixtures({ apiKey, leagueId, season, page }) {
  const url = new URL(`${BASE_URL}/fixtures`);
  url.searchParams.set("league", String(leagueId));
  url.searchParams.set("season", String(season));

  const res = await fetch(url, { headers: { "x-apisports-key": apiKey } });
  const data = await res.json();
  return data;
}

function pickLeagueSeasons(leagueDoc) {
  // Our League documents have a top-level `season` set by fetch_odds_leagues.js
  const currentSeason = Number(leagueDoc?.season);
  if (!Number.isFinite(currentSeason)) return null;
  return { currentSeason, previousSeason: currentSeason - 1 };
}

async function upsertFixtures(fixtures) {
  if (!fixtures.length) return { upserts: 0, modified: 0 };

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
  return { upserts: res.upsertedCount ?? 0, modified: res.modifiedCount ?? 0 };
}

async function main() {
  const yes = process.argv.includes("--yes");
  if (!yes) {
    console.error("Refusing to run without --yes (this script writes to MongoDB).");
    process.exit(1);
  }

  const apiKey = process.env.API_KEY;
  const mongoUri = process.env.MONGO_URI;
  if (!apiKey) throw new Error("API_KEY missing in backend/.env");
  if (!mongoUri) throw new Error("MONGO_URI missing in backend/.env");

  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("✅ Connected.\n");

  const leagues = await League.find({})
    .lean()
    .select("league.id league.name country.name season");

  const leagueIds = leagues.map((l) => Number(l?.league?.id)).filter(Number.isFinite);
  console.log(`📚 Saved leagues: ${leagueIds.length}`);

  console.log("\n🧹 Deleting ALL fixtures first...");
  const wipeRes = await Fixture.deleteMany({});
  console.log(`✅ Deleted ${wipeRes.deletedCount ?? 0} fixtures.\n`);

  let leagueProcessed = 0;
  let seasonsFetched = 0;
  let fixturesRetrieved = 0;

  for (const l of leagues) {
    const leagueId = Number(l?.league?.id);
    if (!Number.isFinite(leagueId)) continue;

    const seasons = pickLeagueSeasons(l);
    if (!seasons) continue;

    const { currentSeason, previousSeason } = seasons;

    leagueProcessed++;
    const leagueName = l?.league?.name ?? String(leagueId);
    console.log(`\n🏟️ ${leagueName} (${leagueId})`);

    const toFetch = [previousSeason, currentSeason];

    for (const season of toFetch) {
      seasonsFetched++;
      console.log(`  📦 Fetching season ${season} fixtures...`);

      let seasonFixtures = [];

      const data = await apiGetFixtures({ apiKey, leagueId, season, page: 1 });
      if (data?.errors && Object.keys(data.errors).length > 0) {
        console.log(`  ❌ API errors for league=${leagueId} season=${season}: ${JSON.stringify(data.errors)}`);
      } else {
        seasonFixtures = Array.isArray(data?.response) ? data.response : [];
      }

      console.log(`  ✅ Retrieved ${seasonFixtures.length} fixtures for season ${season}. Saving...`);
      const { upserts, modified } = await upsertFixtures(seasonFixtures);
      fixturesRetrieved += seasonFixtures.length;
      console.log(`  💾 Saved (upserted=${upserts}, modified=${modified})`);

      // Gentle rate limiting between league-season calls
      await sleep(300);
    }
  }

  console.log("\n🧹 Cleanup: keep ONLY previous+current season fixtures for saved leagues...");
  let deletedTotal = 0;

  // 1) Delete any fixtures for leagues that are NOT in our saved leagues list.
  const resOtherLeagues = await Fixture.deleteMany({
    "fixture.league.id": { $nin: leagueIds },
  });
  deletedTotal += resOtherLeagues.deletedCount ?? 0;

  // 2) For each saved league, delete fixtures not in {previousSeason, currentSeason}.
  for (const l of leagues) {
    const leagueId = Number(l?.league?.id);
    if (!Number.isFinite(leagueId)) continue;
    const seasons = pickLeagueSeasons(l);
    if (!seasons) continue;
    const allowed = [seasons.previousSeason, seasons.currentSeason];

    const res = await Fixture.deleteMany({
      "fixture.league.id": leagueId,
      "fixture.league.season": { $nin: allowed },
    });
    deletedTotal += res.deletedCount ?? 0;
  }
  console.log(`✅ Deleted ${deletedTotal} old fixtures.\n`);

  console.log("🎉 Backfill complete.");
  console.log(`- Leagues processed: ${leagueProcessed}`);
  console.log(`- League-seasons fetched: ${seasonsFetched}`);
  console.log(`- Fixtures retrieved (and attempted to save): ${fixturesRetrieved}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

