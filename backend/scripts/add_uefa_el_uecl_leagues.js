/**
 * Upsert UEFA Europa League (id 3) and UEFA Europa Conference League (id 848)
 * into the `leagues` collection so daily update includes their fixtures.
 *
 * Usage: node scripts/add_uefa_el_uecl_leagues.js
 */
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import League from "../models/League.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local"), override: true });

const LEAGUE_IDS = [
  { id: 3, label: "UEFA Europa League" },
  { id: 848, label: "UEFA Europa Conference League" },
];

const api = axios.create({
  baseURL: "https://v3.football.api-sports.io",
  headers: {
    "x-apisports-key": process.env.API_KEY,
  },
});

async function upsertLeagueFromApi(leagueId, label) {
  const res = await api.get("/leagues", { params: { id: leagueId } });
  const row = res.data?.response?.[0];
  if (!row?.league) {
    console.error(`❌ API returned no league for id=${leagueId} (${label})`);
    return false;
  }

  const currentSeason = Array.isArray(row.seasons)
    ? row.seasons.find((s) => s.current === true)
    : null;
  const seasonYear =
    currentSeason?.year ?? new Date().getFullYear();

  await League.findOneAndUpdate(
    { "league.id": row.league.id },
    {
      league: {
        id: row.league.id,
        name: row.league.name,
        type: row.league.type,
        logo: row.league.logo,
      },
      country: {
        name: row.country.name,
        code: row.country.code,
        flag: row.country.flag,
      },
      seasons: row.seasons,
      season: seasonYear,
      active: true,
      odds: true,
      predictions: true,
    },
    { upsert: true, new: true }
  );

  console.log(`✅ Saved: ${row.league.name} (id=${row.league.id}, season=${seasonYear})`);
  return true;
}

async function main() {
  if (!process.env.API_KEY) {
    console.error("API_KEY missing (backend/.env or .env.local)");
    process.exit(1);
  }
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI missing");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 45_000,
    autoSelectFamily: false,
    retryWrites: true,
  });

  for (const { id, label } of LEAGUE_IDS) {
    console.log(`\n📡 Fetching ${label} (id=${id})...`);
    try {
      await upsertLeagueFromApi(id, label);
    } catch (e) {
      console.error(`❌ ${label}:`, e.response?.data || e.message);
    }
  }

  console.log("\nDone.");
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
