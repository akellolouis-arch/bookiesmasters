function clamp01(x) {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function parsePercent(val) {
  if (val == null) return null;
  if (typeof val === "number" && Number.isFinite(val)) {
    // Accept either 0..1 or 0..100
    if (val > 1) return clamp01(val / 100);
    return clamp01(val);
  }
  if (typeof val !== "string") return null;
  const n = parseFloat(val.replace("%", "").trim());
  if (!Number.isFinite(n)) return null;
  return clamp01(n / 100);
}

function poissonPmf(k, lambda) {
  const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
  return Math.exp(-lambda) * Math.pow(lambda, k) / fact(k);
}

function poissonCdf(k, lambda) {
  let s = 0;
  for (let i = 0; i <= k; i++) s += poissonPmf(i, lambda);
  return s;
}

function getNested(obj, paths) {
  for (const p of paths) {
    let cur = obj;
    const parts = p.split(".");
    let ok = true;
    for (const part of parts) {
      if (cur && typeof cur === "object" && part in cur) cur = cur[part];
      else {
        ok = false;
        break;
      }
    }
    if (ok) return cur;
  }
  return undefined;
}

function extract1x2Probs(pred) {
  const pct = getNested(pred, [
    "percent",
    "prediction.percent",
    "predictions.percent",
  ]);

  if (!pct || typeof pct !== "object") return null;

  const home = parsePercent(pct.home);
  const draw = parsePercent(pct.draw);
  const away = parsePercent(pct.away);

  if (home == null || draw == null || away == null) return null;

  // Normalize just in case
  const sum = home + draw + away;
  if (sum <= 0) return null;
  return {
    home: clamp01(home / sum),
    draw: clamp01(draw / sum),
    away: clamp01(away / sum),
  };
}

function extractExpectedGoals(pred) {
  const g = getNested(pred, [
    "goals",
    "prediction.goals",
    "predictions.goals",
  ]);
  if (!g || typeof g !== "object") return null;
  const h = typeof g.home === "string" ? parseFloat(g.home) : g.home;
  const a = typeof g.away === "string" ? parseFloat(g.away) : g.away;
  if (!Number.isFinite(h) || !Number.isFinite(a)) return null;
  return { home: Math.max(0.05, h), away: Math.max(0.05, a) };
}

export function getMarketsFromApiPrediction(pred) {
  if (!pred || typeof pred !== "object") return null;

  const probs1x2 = extract1x2Probs(pred);
  const eg = extractExpectedGoals(pred);

  let over15 = null;
  let under35 = null;
  let btts = null;

  if (eg) {
    const lambdaTotal = eg.home + eg.away;
    const pOver15 = clamp01(1 - poissonCdf(1, lambdaTotal));
    const pUnder35 = clamp01(poissonCdf(3, lambdaTotal));
    const pBttsYes = clamp01(
      1 - Math.exp(-eg.home) - Math.exp(-eg.away) + Math.exp(-(eg.home + eg.away))
    );
    over15 = { pick: "OV1.5", probability: pOver15 };
    under35 = { pick: "UN3.5", probability: pUnder35 };
    btts = { pick: "BTTS", probability: pBttsYes };
  }

  const candidates = [];
  if (probs1x2) {
    candidates.push({ market: "1X2", pick: "1", probability: probs1x2.home });
    candidates.push({ market: "1X2", pick: "X", probability: probs1x2.draw });
    candidates.push({ market: "1X2", pick: "2", probability: probs1x2.away });
  }
  if (over15 && over15.probability >= 0.85) candidates.push({ market: "OV15", pick: over15.pick, probability: over15.probability });
  if (under35 && under35.probability >= 0.85) candidates.push({ market: "UN35", pick: under35.pick, probability: under35.probability });
  if (btts) candidates.push({ market: "BTTS", pick: btts.pick, probability: btts.probability });

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => b.probability - a.probability);
  const bestPick = candidates[0];

  return {
    oneXtwo: probs1x2 || null,
    over15,
    under35,
    btts,
    bestPick,
  };
}

/**
 * Build a single "best pick" from the stored API-Football prediction object.
 * Returns null if we can't extract any probabilities.
 */
export function getBestPickFromApiPrediction(pred) {
  const markets = getMarketsFromApiPrediction(pred);
  return markets ? markets.bestPick : null;
}

