// API-Football prediction only (1, 2, 1X, X2) — no OV15/UN35/BTTS best-pick logic

const VALID_CUSTOM_TIPS = new Set(["1", "2", "X", "1X", "X2"]);

/**
 * Raw API/custom tip before UI formatting (1, 2, X, 1X, X2, or N/A).
 * Shared resolver for scripts/tools; cards use this via formatFixtureCard.
 */
export function resolvePredictionTip(fixtureDoc) {
  const fx = fixtureDoc?.fixture;
  if (!fx?.teams?.home?.name) return "N/A";

  let tip = "N/A";
  const customRaw =
    typeof fixtureDoc.customPrediction === "string"
      ? fixtureDoc.customPrediction.trim()
      : "";
  const pred =
    customRaw && VALID_CUSTOM_TIPS.has(customRaw)
      ? customRaw
      : fixtureDoc.prediction;

  if (typeof pred === "string") {
    tip = pred;
  } else if (pred && typeof pred === "object") {
    const { win_or_draw, winner } = pred;
    const homeName = fx.teams.home.name;

    if (win_or_draw === true) {
      tip = winner && winner.name === homeName ? "1X" : "X2";
    } else {
      tip = winner && winner.name === homeName ? "1" : "2";
    }
  }

  return tip;
}

export function formatFixtureCard(fixtureDoc) {
  const fx = fixtureDoc.fixture;
  const kickoffTime = new Date(fx.fixture.date).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Nairobi",
  });

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
  let odds = {
    home: null,
    draw: null,
    away: null,
    bttsYes: null,
    bttsNo: null,
    over15: null,
    under35: null,
  };

  // Always use Pre-match Odds (from fixtureDoc.odds)
  if (fixtureDoc.odds && fixtureDoc.odds.length > 0) {
    const bookmaker = fixtureDoc.odds[0];

    if (bookmaker && bookmaker.markets) {
      const matchWinner = bookmaker.markets.find((m) => {
        if (!m) return false;
        if (m.id === 1) return true;
        const n = (m.name || "").trim().toLowerCase();
        return (
          n === "match winner" ||
          n === "full time result" ||
          n === "1x2"
        );
      });
      if (matchWinner && matchWinner.values) {
        const vals = matchWinner.values;
        const homeOdd = vals.find(
          (v) => v.value === "Home" || v.value === "1"
        )?.odd;
        const drawOdd = vals.find(
          (v) => v.value === "Draw" || v.value === "X"
        )?.odd;
        const awayOdd = vals.find(
          (v) => v.value === "Away" || v.value === "2"
        )?.odd;
        odds.home = homeOdd != null ? String(homeOdd) : null;
        odds.draw = drawOdd != null ? String(drawOdd) : null;
        odds.away = awayOdd != null ? String(awayOdd) : null;
      }

      const bttsMarket = bookmaker.markets.find(
        m => m.name && (m.name === "Both Teams To Score" || m.name === "Both teams to score")
      );
      if (bttsMarket && bttsMarket.values) {
        odds.bttsYes = bttsMarket.values.find(v => v.value === "Yes")?.odd || null;
        odds.bttsNo = bttsMarket.values.find(v => v.value === "No")?.odd || null;
      }

      const ouMarket = bookmaker.markets.find(
        m => m.name && (m.name === "Goals Over/Under" || m.name === "Over/Under")
      );
      if (ouMarket && ouMarket.values) {
        odds.over15 = ouMarket.values.find(v => v.value === "Over 1.5")?.odd || null;
        odds.under35 = ouMarket.values.find(v => v.value === "Under 3.5")?.odd || null;
      }
    }
  }

  // -----------------------------
  // PREDICTION HANDLING — API-Football only (1, 2, 1X, X2)
  // -----------------------------
  const tip = resolvePredictionTip(fixtureDoc);

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
    isVip: false,
    creditCost: 0,
    customOdds: fixtureDoc.customOdds,
    prediction: tip,
    kickoffTime,
  };
}
