import { getBestPickFromApiPrediction } from "./bestPickFromApiPrediction.js";

export function formatFixtureCard(fixtureDoc) {
  const fx = fixtureDoc.fixture;

  // 🔥 PRIORITY: Use live data if available
  const live = fixtureDoc.livescore;

  // Determine source of truth for Status and Goals
  // If we have live data, use it. Otherwise use the main (static) fixture data.
  const status = live?.status || fx.fixture.status;
  const goals = live?.goals || fx.goals;

  // -----------------------------
  // STATUS HANDLING
  // -----------------------------
  let displayStatus = "";
  const shortStatus = status.short; // "NS", "1H", "FT", etc.

  // Helper: Is the match live?
  // Note: API-Football live statuses
  const isLive = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(shortStatus);

  // 1️⃣ LIVE → Show Minutes (e.g. "34'")
  if (isLive) {
    if (shortStatus === "HT") {
      displayStatus = "HT";
    } else if (status.elapsed) {
      // Check for extra time (e.g. 45+2, 90+4)
      if (status.extra) {
        displayStatus = `${status.elapsed}+${status.extra}'`;
      } else {
        displayStatus = `${status.elapsed}'`;
      }
    } else {
      displayStatus = "Live";
    }
  }

  // 2️⃣ FINISHED → Show "FT"
  else if (shortStatus === "FT" || shortStatus === "AET" || shortStatus === "PEN") {
    displayStatus = "FT";
  }

  // 3️⃣ NOT STARTED → Show Time (e.g. "22:00")
  else if (shortStatus === "NS") {
    const dateObj = new Date(fx.fixture.date);
    displayStatus = dateObj.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Africa/Nairobi",
    });
  }

  // 4️⃣ OTHERS (Postponed, Cancelled, etc.)
  else {
    displayStatus = shortStatus;
  }

  // -----------------------------
  // SCORE HANDLING
  // -----------------------------
  // Show score if Live or Finished
  let scoreDisplay = null;
  if (isLive || ["FT", "AET", "PEN"].includes(shortStatus)) {
    if (goals && goals.home !== null && goals.away !== null) {
      scoreDisplay = `${goals.home} - ${goals.away}`;
    }
  }

  // -----------------------------
  // ODDS HANDLING
  // -----------------------------
  let odds = { home: null, draw: null, away: null };

  // ODDS HANDLING
  // Always use Pre-match Odds (from fixtureDoc.odds) as requested
  if (fixtureDoc.odds && fixtureDoc.odds.length > 0) {
    // The "odds" array is now filtered by aggregation to only have Match Winner
    // We can assume the first bookmaker has the market we want
    const bookmaker = fixtureDoc.odds[0];

    // Safety check just in case aggregation wasn't perfect or old data
    if (bookmaker && bookmaker.markets) {
      const matchWinner = bookmaker.markets.find(
        m => m.name && (m.name === "Match Winner" || m.id === 1)
      );

      if (matchWinner && matchWinner.values) {
        odds.home = matchWinner.values.find(v => v.value === "Home")?.odd || null;
        odds.draw = matchWinner.values.find(v => v.value === "Draw")?.odd || null;
        odds.away = matchWinner.values.find(v => v.value === "Away")?.odd || null;
      }
    }
  }

  // -----------------------------
  // PREDICTION HANDLING
  // -----------------------------
  let tip = "N/A";
  let tipProbability = null;
  const pred = fixtureDoc.prediction;

  if (typeof pred === "string") {
    // It's a manual override or pre-calculated string
    tip = pred;
  } else if (pred && typeof pred === "object") {
    // Prefer "highest probability among 1X2/BTTS/Ov1.5/Un3.5" when possible.
    const best = getBestPickFromApiPrediction(pred);
    if (best) {
      tip = best.pick;
      tipProbability = best.probability;
    } else {
      // Fallback to legacy winner/win_or_draw logic
      const { win_or_draw, winner } = pred;
      const homeName = fx.teams.home.name;

      if (win_or_draw === true) {
        // Double Chance
        if (winner && winner.name === homeName) {
          tip = "1X";
        } else {
          tip = "X2";
        }
      } else {
        // Single Choice
        if (winner && winner.name === homeName) {
          tip = "1";
        } else {
          tip = "2";
        }
      }
    }
  }

  return {
    fixtureId: fixtureDoc.fixtureId,
    status: displayStatus,
    score: scoreDisplay,
    league: {
      id: fx.league.id,
      name: fx.league.name,
      logo: fx.league.logo,
      country: fx.league.country
    },
    homeTeam: {
      id: fx.teams.home.id,
      name: fx.teams.home.name,
      logo: fx.teams.home.logo
    },
    awayTeam: {
      id: fx.teams.away.id,
      name: fx.teams.away.name,
      logo: fx.teams.away.logo
    },
    odds,
    isVip: false, // Force false
    creditCost: 0,
    customOdds: fixtureDoc.customOdds,
    prediction: tip, // Always return a string
    predictionProbability: tipProbability, // 0..1 when available
  };
}
