/**
 * Backfill fixtures for current + previous season for UEFA Europa League (3)
 * and UEFA Europa Conference League (848) only — same behaviour as
 * backfill_fixtures_two_seasons.js but limited to those leagues.
 *
 * Requires leagues 3 and 848 to exist in `leagues` with a numeric `season`
 * (e.g. run add_uefa_el_uecl_leagues.js first).
 *
 * Usage:
 *   node scripts/backfill_fixtures_uefa_el_uecl_only.js --yes
 *   node scripts/backfill_fixtures_uefa_el_uecl_only.js --yes --prune
 *
 * --prune: for leagues 3 and 848 only, deletes fixture rows whose season is
 *          not in {previousSeason, currentSeason}. Does NOT touch other leagues.
 *
 * Requires: API_KEY, MONGO_URI (backend/.env and/or .env.local)
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

const DEFAULT_IDS = [3, 848];

function parseTargetIds() {
  const raw = process.env.UEFA_EL_UECL_LEAGUE_IDS;
  if (!raw || !String(raw).trim()) return DEFAULT_IDS;
  return String(raw)
    .split(/[,\s]+/)
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

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
    console.error(
      "Refusing to run without --yes (this script writes to MongoDB)."
    );
    process.exit(1);
  }

  const apiKey = process.env.API_KEY;
  const mongoUri = process.env.MONGO_URI;
  if (!apiKey) throw new Error("API_KEY missing (backend/.env or .env.local)");
  if (!mongoUri) throw new Error("MONGO_URI missing (backend/.env or .env.local)");

  const targetIds = parseTargetIds();
  console.log("Target league ids:", targetIds.join(", "));

  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(mongoUri, MONGO_OPTIONS);
  console.log("✅ Connected.\n");

  const leagues = await League.find({ "league.id": { $in: targetIds } })
    .lean()
    .select("league.id league.name country.name season");

  if (leagues.length === 0) {
    console.error(
      "No matching leagues in DB. Add them first (e.g. add_uefa_el_uecl_leagues.js)."
    );
    process.exit(1);
  }

  const foundIds = leagues.map((l) => l.league.id);
  for (const id of targetIds) {
    if (!foundIds.includes(id)) {
      console.warn(`⚠️ League id ${id} not found in MongoDB — skipping.`);
    }
  }

  console.log(
    doPrune
      ? "🧹 --prune: will remove EL/UECL fixtures outside previous+current season only.\n"
      : "⏭️ Incremental: skip league+season if rows already exist.\n"
  );

  let seasonsSkipped = 0;
  let seasonsFetched = 0;
  let fixturesRetrieved = 0;

  for (const l of leagues) {
    const leagueId = Number(l?.league?.id);
    if (!Number.isFinite(leagueId)) continue;

    const seasons = pickLeagueSeasons(l);
    if (!seasons) {
      console.warn(
        `⚠️ ${l?.league?.name ?? leagueId}: no numeric season on league doc — skip`
      );
      continue;
    }

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
        console.log(
          `  ✅ Retrieved ${seasonFixtures.length} fixtures for season ${season}. Saving...`
        );
        const { upserts, modified } = await upsertFixtures(seasonFixtures);
        fixturesRetrieved += seasonFixtures.length;
        console.log(`  💾 Saved (upserted=${upserts}, modified=${modified})`);
      }

      await sleep(300);
    }
  }

  if (doPrune) {
    console.log(
      "\n🧹 Prune: remove EL/UECL fixtures outside previous+current season only..."
    );
    let deletedTotal = 0;

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
    console.log(`✅ Deleted ${deletedTotal} fixtures (leagues ${targetIds.join(", ")} only).\n`);
  }

  console.log("🎉 UEFA EL / UECL backfill complete.");
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
