/**
 * API-Football predictions + odds fetch (shared by dailyUpdateService and one-off scripts).
 * Lazy axios client so callers can load dotenv before first request.
 */
import axios from "axios";

let _api = null;

export function getFootballApi() {
  if (!_api) {
    _api = axios.create({
      baseURL: "https://v3.football.api-sports.io",
      headers: {
        "x-apisports-key": process.env.API_KEY,
      },
    });
  }
  return _api;
}

/** API-Football terminal / final match statuses — do not burn quota on predictions/odds. */
const FINISHED_STATUS_SHORT = new Set(["FT", "AET", "PEN", "AWD", "WO"]);

export function isFinishedStatusShort(short) {
  if (short == null || short === "") return false;
  return FINISHED_STATUS_SHORT.has(String(short).toUpperCase());
}

function isMatchWinnerMarket(bet) {
  if (!bet) return false;
  if (bet.id === 1) return true;
  const n = (bet.name || "").trim().toLowerCase();
  return (
    n === "match winner" ||
    n === "full time result" ||
    n === "1x2" ||
    n === "3-way result" ||
    n === "winner"
  );
}

function getOddsBookmakerIds() {
  const raw = process.env.ODDS_BOOKMAKER_IDS || "11,8";
  return raw
    .split(/[,\s]+/)
    .map((s) => Number(String(s).trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function normalizeApiBookmakersToOurOddsShape(bookmakers) {
  if (!Array.isArray(bookmakers)) return [];
  return bookmakers.map((b) => ({
    id: b.id,
    name: b.name,
    logo: b.logo ?? null,
    markets: (b.bets || [])
      .filter((m) => isMatchWinnerMarket(m))
      .map((m) => ({
        id: 1,
        name: "Match Winner",
        values: (m.values || []).map((v) => ({
          value: v.value,
          odd: v.odd != null ? String(v.odd) : v.odd,
        })),
      })),
  }));
}

function oddsPayloadHasMatchWinner(normalized) {
  return normalized.some(
    (b) =>
      Array.isArray(b.markets) &&
      b.markets.some((m) => Array.isArray(m.values) && m.values.length > 0)
  );
}

export async function fetchPrediction(fixtureId) {
  try {
    const res = await getFootballApi().get(`/predictions`, {
      params: { fixture: fixtureId },
    });

    const data = res.data?.response?.[0];
    if (!data) return { prediction: null, h2h: null };

    return {
      prediction: data.predictions || null,
      h2h: data.h2h || null,
    };
  } catch (err) {
    console.log(`⚠ Prediction not available for fixture ${fixtureId}: ${err.message}`);
    return { prediction: null, h2h: null };
  }
}

async function fetchOddsForBookmaker(fixtureId, bookmakerId) {
  const res = await getFootballApi().get(`/odds`, {
    params: { fixture: fixtureId, bookmaker: bookmakerId },
  });
  const odds = res.data?.response?.[0];
  if (!odds || !odds.bookmakers?.length) return null;
  const normalized = normalizeApiBookmakersToOurOddsShape(odds.bookmakers);
  if (!oddsPayloadHasMatchWinner(normalized)) return null;
  return normalized;
}

export async function fetchOdds(fixtureId) {
  const bookmakerIds = getOddsBookmakerIds();
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 1500;

  for (const bookmakerId of bookmakerIds) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const normalized = await fetchOddsForBookmaker(fixtureId, bookmakerId);
        if (normalized) return normalized;
        break;
      } catch (err) {
        const statusCode = err?.response?.status;
        const shouldRetry =
          statusCode === 429 || (statusCode >= 500 && statusCode < 600);
        if (shouldRetry && attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
          continue;
        }
        if (!shouldRetry || attempt === MAX_RETRIES) {
          console.log(
            `⚠ Odds bm=${bookmakerId} fixture ${fixtureId}: ${err.message}`
          );
        }
        break;
      }
    }
  }
  return [];
}
