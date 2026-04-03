/**
 * Predictions list: show only fixtures with at least one Match Winner (1×2) price.
 */

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
  return !!(o && (o.home || o.draw || o.away));
}
