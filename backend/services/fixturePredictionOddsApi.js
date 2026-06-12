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



export async function fetchHeadToHead(homeTeamId, awayTeamId) {
  try {
    const res = await getFootballApi().get(`/fixtures/headtohead`, {
      params: { h2h: `${homeTeamId}-${awayTeamId}` },
    });

    const h2hArray = res.data?.response || [];
    return h2hArray;
  } catch (err) {
    console.log(`⚠ H2H not available for ${homeTeamId}-${awayTeamId}: ${err.message}`);
    return [];
  }
}

