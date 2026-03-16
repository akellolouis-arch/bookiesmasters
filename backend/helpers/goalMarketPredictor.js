// Goal market prediction helpers (lightweight, no external deps)

function clamp01(x) {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function avg(nums) {
  const valid = nums.filter(n => typeof n === "number" && Number.isFinite(n));
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function extractTeamGoalStats(teamId, matches, maxMatches = 10) {
  if (!Array.isArray(matches) || matches.length === 0) {
    return { played: 0, gfAvg: null, gaAvg: null, totalAvg: null };
  }

  const recent = matches.slice(0, maxMatches);
  const gf = [];
  const ga = [];
  const totals = [];

  for (const m of recent) {
    const homeId = m?.homeTeam?.id;
    const awayId = m?.awayTeam?.id;
    const h = m?.score?.home;
    const a = m?.score?.away;
    if (!Number.isFinite(h) || !Number.isFinite(a)) continue;
    if (homeId !== teamId && awayId !== teamId) continue;

    const isHome = homeId === teamId;
    const goalsFor = isHome ? h : a;
    const goalsAgainst = isHome ? a : h;
    gf.push(goalsFor);
    ga.push(goalsAgainst);
    totals.push(h + a);
  }

  return {
    played: totals.length,
    gfAvg: avg(gf),
    gaAvg: avg(ga),
    totalAvg: avg(totals),
  };
}

function poissonPmf(k, lambda) {
  // k is small (0-3 in our usage), so plain factorial is fine.
  const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
  return Math.exp(-lambda) * Math.pow(lambda, k) / fact(k);
}

function poissonCdf(k, lambda) {
  let s = 0;
  for (let i = 0; i <= k; i++) s += poissonPmf(i, lambda);
  return s;
}

/**
 * Predict P(Over 1.5) and P(Under 3.5) using a simple total-goals Poisson model.
 *
 * Inputs are team recent matches as returned by formCalculator (`allMatches`), plus team ids.
 */
export function predictGoalMarkets({
  homeTeamId,
  awayTeamId,
  homeMatches,
  awayMatches,
}) {
  const home = extractTeamGoalStats(homeTeamId, homeMatches, 10);
  const away = extractTeamGoalStats(awayTeamId, awayMatches, 10);

  // Fallbacks: if we have no recent stats, default to a conservative mean.
  const homeGf = home.gfAvg ?? 1.2;
  const homeGa = home.gaAvg ?? 1.2;
  const awayGf = away.gfAvg ?? 1.1;
  const awayGa = away.gaAvg ?? 1.1;

  // Expected goals for each side: blend scoring ability with opponent concession.
  const lambdaHome = Math.max(0.2, (homeGf + awayGa) / 2);
  const lambdaAway = Math.max(0.2, (awayGf + homeGa) / 2);
  const lambdaTotal = lambdaHome + lambdaAway;

  // Over 1.5 means total goals >= 2, so 1 - P(0) - P(1)
  const pOver15 = clamp01(1 - poissonCdf(1, lambdaTotal));

  // Under 3.5 means total goals <= 3, so CDF(3)
  const pUnder35 = clamp01(poissonCdf(3, lambdaTotal));

  return {
    model: "poisson_total_goals_v1",
    inputs: {
      home: { played: home.played, gfAvg: home.gfAvg, gaAvg: home.gaAvg },
      away: { played: away.played, gfAvg: away.gfAvg, gaAvg: away.gaAvg },
    },
    lambda: {
      home: lambdaHome,
      away: lambdaAway,
      total: lambdaTotal,
    },
    markets: {
      over15: {
        pick: "OVER 1.5",
        probability: pOver15, // 0..1
      },
      under35: {
        pick: "UNDER 3.5",
        probability: pUnder35, // 0..1
      },
    },
  };
}

