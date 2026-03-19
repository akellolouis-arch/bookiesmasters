import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import Fixture from "../models/Fixture.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

function getDatePlus(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function summarizeOddsResponse(resp) {
  const item = resp?.data?.response?.[0];
  const bms = item?.bookmakers || [];
  const summary = bms.map((b) => ({
    bookmaker: b.name,
    markets: (b.bets || []).map((m) => m.name),
  }));
  return {
    hasResponse: Boolean(item),
    bookmakersCount: bms.length,
    summary,
  };
}

async function main() {
  const date = process.env.DATE || getDatePlus(2);
  const start = new Date(`${date}T00:00:00.000Z`).toISOString();
  const end = new Date(`${date}T23:59:59.999Z`).toISOString();

  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookiesmasters");

  const fixtureDoc = await Fixture.findOne({
    "fixture.fixture.date": { $gte: start, $lte: end },
  }).lean();

  if (!fixtureDoc) {
    console.log(`No fixture found for DATE=${date}`);
    process.exit(0);
  }

  const fixtureId = fixtureDoc.fixtureId;
  const home = fixtureDoc?.fixture?.teams?.home?.name || "Home";
  const away = fixtureDoc?.fixture?.teams?.away?.name || "Away";
  const league = fixtureDoc?.fixture?.league?.name || "Unknown League";

  const api = axios.create({
    baseURL: "https://v3.football.api-sports.io",
    headers: { "x-apisports-key": process.env.API_KEY },
    timeout: 30000,
  });

  const oneXbet = await api.get("/odds", { params: { fixture: fixtureId, bookmaker: 11 } });
  const bet365 = await api.get("/odds", { params: { fixture: fixtureId, bookmaker: 8 } });

  console.log(`DATE=${date}`);
  console.log(`FIXTURE_ID=${fixtureId}`);
  console.log(`MATCH=${home} vs ${away}`);
  console.log(`LEAGUE=${league}`);
  console.log("ODDS_1XBET=" + JSON.stringify(summarizeOddsResponse(oneXbet), null, 2));
  console.log("ODDS_BET365=" + JSON.stringify(summarizeOddsResponse(bet365), null, 2));

  process.exit(0);
}

main().catch((e) => {
  console.error(e?.response?.data || e.message || e);
  process.exit(1);
});

