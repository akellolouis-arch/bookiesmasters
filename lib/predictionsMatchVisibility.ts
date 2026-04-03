/**
 * Backend `/api/fixtures/cards` can include fixtures with no 1X2 in the payload:
 * finished/live rows use `isPlayedOrLive` while odds markets may be missing from DB.
 * The card UI still renders (scores, tips, "-" for odds). Align list filter with that.
 */
const LIVE_STATUS_SHORT = new Set([
  "1H",
  "HT",
  "2H",
  "ET",
  "BT",
  "P",
  "LIVE",
  "INT",
]);

export function shouldShowMatchOnPredictionsPage(match: {
  odds?: {
    home?: string | null;
    draw?: string | null;
    away?: string | null;
  } | null;
  prediction?: string | null;
  score?: string | null;
  status?: string;
}): boolean {
  const o = match.odds;
  if (o && (o.home || o.draw || o.away)) return true;
  if (match.prediction && match.prediction !== "N/A") return true;
  if (match.score) return true;
  const s = match.status ?? "";
  if (LIVE_STATUS_SHORT.has(s) || s.includes("'")) return true;
  if (s === "FT") return true;
  return false;
}
