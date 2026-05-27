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



export async function fetchPrediction(fixtureId) {
  try {
    const res = await getFootballApi().get(`/predictions`, {
      params: { fixture: fixtureId },
    });

    const data = res.data?.response?.[0];
    if (!data) return { h2h: null };

    return {
      h2h: data.h2h || null,
    };
  } catch (err) {
    console.log(`⚠ Prediction not available for fixture ${fixtureId}: ${err.message}`);
    return { h2h: null };
  }
}

