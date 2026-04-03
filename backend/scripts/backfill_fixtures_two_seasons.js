/**
 * Backfill fixtures for current + previous season for saved leagues.
 *
 * Default (incremental):
 * - Does NOT delete existing fixtures.
 * - For each saved league, fetches previous + current season only if that
 *   league+season has no documents yet (saves API quota; safe to re-run after crashes).
 * - Does NOT prune stray leagues/seasons unless you pass --prune.
 *
 * Usage:
 *   node backend/scripts/backfill_fixtures_two_seasons.js --yes
 *   node backend/scripts/backfill_fixtures_two_seasons.js --yes --prune
 *
 * Requires:
 * - API_KEY and MONGO_URI in backend/.env and/or repo root .env.local
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

const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 45_000,
  autoSelectFamily: false,
  retryWrites: true,
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function apiGetFixtures({ apiKey, leagueId, season }, maxAttempts = 4) {
  const url = new URL(`${BASE_URL}/fixtures`);
  url.searchParams.set("league", String(leagueId));
  url.searchParams.set("season", String(season));

  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, { headers: { "x-apisports-key": apiKey } });
      const data = await res.json();
      return data;
    } catch (err) {
      lastErr = err;
      console.warn(
        `  ⚠️ fetch attempt ${attempt}/${maxAttempts} failed: ${err.message}`
      );
      if (attempt < maxAttempts) {
        await sleep(800 * attempt);
      }
    }
  }
  throw lastErr;
}

function pickLeagueSeasons(leagueDoc) {
  const currentSeason = Number(leagueDoc?.season);
  if (!Number.isFinite(currentSeason)) return null;
  return { currentSeason, previousSeason: currentSeason - 1 };
}

async function seasonFixtureCount(leagueId, season) {
  return Fixture.countDocuments({
    "fixture.league.id": leagueId,
    "fixture.league.season": season,
  });
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
  const doPrune = process.argv.includes("--prune");

  if (!yes) {
    console.error("Refusing to run without --yes (this script writes to MongoDB).");
    process.exit(1);
  }

  const apiKey = process.env.API_KEY;
  const mongoUri = process.env.MONGO_URI;
  if (!apiKey) throw new Error("API_KEY missing (backend/.env or .env.local)");
  if (!mongoUri) throw new Error("MONGO_URI missing (backend/.env or .env.local)");

  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(mongoUri, MONGO_OPTIONS);
  console.log("✅ Connected.\n");

  const leagues = await League.find({})
    .lean()
    .select("league.id league.name country.name season");

  const leagueIds = leagues.map((l) => Number(l?.league?.id)).filter(Number.isFinite);
  console.log(`📚 Saved leagues: ${leagueIds.length}`);
  console.log(
    doPrune
      ? "🧹 --prune: will remove fixtures outside saved leagues / target seasons after fetch.\n"
      : "⏭️ No full wipe; skipping league-seasons that already have rows in DB.\n"
  );

  let seasonsSkipped = 0;
  let seasonsFetched = 0;
  let fixturesRetrieved = 0;

  for (const l of leagues) {
    const leagueId = Number(l?.league?.id);
    if (!Number.isFinite(leagueId)) continue;

    const seasons = pickLeagueSeasons(l);
    if (!seasons) continue;

    const { currentSeason, previousSeason } = seasons;
    const toFetch = [previousSeason, currentSeason];

    const leagueName = l?.league?.name ?? String(leagueId);
    let leagueHeaderPrinted = false;

    for (const season of toFetch) {
      const existing = await seasonFixtureCount(leagueId, season);
      if (existing > 0) {
        seasonsSkipped++;
        if (!leagueHeaderPrinted) {
          console.log(`\n🏟️ ${leagueName} (${leagueId})`);
          leagueHeaderPrinted = true;
        }
        console.log(
          `  ⏭️ Skip season ${season} (${existing} fixture rows already in DB)`
        );
        continue;
      }

      if (!leagueHeaderPrinted) {
        console.log(`\n🏟️ ${leagueName} (${leagueId})`);
        leagueHeaderPrinted = true;
      }

      seasonsFetched++;
      console.log(`  📦 Fetching season ${season} fixtures...`);

      const data = await apiGetFixtures({ apiKey, leagueId, season });
      if (data?.errors && Object.keys(data.errors).length > 0) {
        console.log(
          `  ❌ API errors for league=${leagueId} season=${season}: ${JSON.stringify(data.errors)}`
        );
      } else {
        const seasonFixtures = Array.isArray(data?.response) ? data.response : [];
        console.log(`  ✅ Retrieved ${seasonFixtures.length} fixtures for season ${season}. Saving...`);
        const { upserts, modified } = await upsertFixtures(seasonFixtures);
        fixturesRetrieved += seasonFixtures.length;
        console.log(`  💾 Saved (upserted=${upserts}, modified=${modified})`);
      }

      await sleep(300);
    }
  }

  if (doPrune) {
    console.log("\n🧹 Cleanup (--prune): keep ONLY previous+current season for saved leagues...");
    let deletedTotal = 0;

    const resOtherLeagues = await Fixture.deleteMany({
      "fixture.league.id": { $nin: leagueIds },
    });
    deletedTotal += resOtherLeagues.deletedCount ?? 0;

    for (const l of leagues) {
      const leagueId = Number(l?.league?.id);
      if (!Number.isFinite(leagueId)) continue;
      const s = pickLeagueSeasons(l);
      if (!s) continue;
      const allowed = [s.previousSeason, s.currentSeason];

      const res = await Fixture.deleteMany({
        "fixture.league.id": leagueId,
        "fixture.league.season": { $nin: allowed },
      });
      deletedTotal += res.deletedCount ?? 0;
    }
    console.log(`✅ Deleted ${deletedTotal} pruned fixtures.\n`);
  }

  console.log("🎉 Backfill complete.");
  console.log(`- League-season API calls: ${seasonsFetched}`);
  console.log(`- League-seasons skipped (already in DB): ${seasonsSkipped}`);
  console.log(`- Fixtures retrieved (this run): ${fixturesRetrieved}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
