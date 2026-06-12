
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
    kickoffTime,
    ...(fixtureDoc.tip ? { prediction: fixtureDoc.tip } : {}),
  };
}
