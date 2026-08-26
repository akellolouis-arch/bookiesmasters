import Fixture from "../models/Fixture.js";
import { formatFixtureCard } from "../helpers/fixtureFormatter.js";

/** Country A→Z, then league name A→Z (e.g. all England leagues together, ordered). */
function compareCountryThenLeagueName(a, b) {
  const countryA = (a?.country ?? "").toString();
  const countryB = (b?.country ?? "").toString();
  const c = countryA.localeCompare(countryB, "en", { sensitivity: "base" });
  if (c !== 0) return c;
  const nameA = (a?.name ?? "").toString();
  const nameB = (b?.name ?? "").toString();
  return nameA.localeCompare(nameB, "en", { sensitivity: "base" });
}

function sortDocsByCountryLeagueKickoff(docs) {
  return [...docs].sort((x, y) => {
    const lx = x.fixture?.league;
    const ly = y.fixture?.league;
    const c = compareCountryThenLeagueName(lx, ly);
    if (c !== 0) return c;
    const dx = new Date(x.fixture?.fixture?.date || 0).getTime();
    const dy = new Date(y.fixture?.fixture?.date || 0).getTime();
    return dx - dy;
  });
}

function sortLeagueGroups(groups) {
  return [...groups].sort((ga, gb) =>
    compareCountryThenLeagueName(ga.league, gb.league)
  );
}

export async function getFixturesGroupedByLeague(date) {
  if (!date) throw new Error("Date parameter is required");

  // 1. Calculate Kenya Start & End of Day in UTC
  // Kenya is UTC+3.
  // "2025-12-27 00:00:00" Kenya = "2025-12-26 21:00:00" UTC
  // "2025-12-27 23:59:59" Kenya = "2025-12-27 20:59:59" UTC

  // We can use standard Date logic by forcing the time string parsing

  const startOfDayKenya = new Date(`${date}T00:00:00+03:00`);
  const endOfDayKenya = new Date(`${date}T23:59:59.999+03:00`);

  // Convert to native Date objects (which is what Mongoose queries against)
  // Note: Mongoose stores dates as UTC dates.

  const matchFilter = {
    "fixture.fixture.date": {
      $gte: startOfDayKenya.toISOString(),
      $lte: endOfDayKenya.toISOString()
    }
  };

  // Fetch all fixtures for the date using Aggregation for Deep Filtering
  const fetchLabel = `DB:FetchFixtures:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  console.time(fetchLabel);
  const fixtures = await Fixture.aggregate([
    {
      $match: matchFilter
    },
    // ⚡ OPTIMIZATION: Project ONLY what is needed EARLY to reduce memory usage during Sort/Lookup
    {
      $project: {
        fixtureId: 1,
        "fixture.id": 1,
        "fixture.name": 1,
        "fixture.logo": 1,
        "fixture.country": 1,
        "fixture.fixture": 1,
        "fixture.league": 1,
        "fixture.teams": 1,
        "fixture.goals": 1,
        "fixture.score": 1,
        "fixture.status": 1,
        "livescore": 1,
      }
    },
    // 🔥 JOIN WITH VIP FIXTURES
    {
      $lookup: {
        from: "vipfixtures", // Lowercase plural of model name
        localField: "fixtureId",
        foreignField: "fixtureId",
        as: "vipData"
      }
    },
    // Unwind checking for existence
    {
      $unwind: {
        path: "$vipData",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $sort: {
        "fixture.league.country": 1,
        "fixture.league.name": 1,
        "fixture.fixture.date": 1
      }
    },
    {
      $project: {
        fixtureId: 1,
        "fixture.id": 1,
        "fixture.name": 1,
        "fixture.logo": 1,
        "fixture.country": 1,
        "fixture.fixture": 1,
        "fixture.league": 1,
        "fixture.teams": 1,
        "fixture.goals": 1,
        "fixture.score": 1,
        "fixture.status": 1,

        "livescore": 1,
      }
    }
  ]);
  console.timeEnd(fetchLabel);

  // Filter out friendlies and stuck NS matches
  const validFixtures = fixtures.filter((f) => {
    if (f.fixture?.league?.name?.toLowerCase().includes("friendlies")) {
      return false;
    }
    // Drop NS matches that are 30+ mins past scheduled kickoff
    if (f.fixture?.fixture?.status?.short === "NS" && f.fixture?.fixture?.date) {
      const kickoff = new Date(f.fixture.fixture.date).getTime();
      const now = new Date().getTime();
      const diffMins = (now - kickoff) / (1000 * 60);
      if (diffMins > 30) {
        return false;
      }
    }
    return true;
  });

  const orderedDocs = sortDocsByCountryLeagueKickoff(validFixtures);

  // Group by league (iteration order = country → league → kickoff)
  const grouped = {};
  orderedDocs.forEach(doc => {
    const league = doc.fixture.league;
    const leagueId = league.id;

    if (!grouped[leagueId]) {
      grouped[leagueId] = {
        league: {
          id: league.id,
          name: league.name,
          logo: league.logo,
          country: league.country
        },
        matches: []
      };
    }

    grouped[leagueId].matches.push(formatFixtureCard(doc));
  });

  return sortLeagueGroups(Object.values(grouped));
}

export async function getLiveFixturesGroupedByLeague() {
  const LIVE_STATUSES = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 2);

  const liveFixtures = await Fixture.aggregate([
    {
      $match: {
        "fixture.fixture.status.short": { $in: LIVE_STATUSES },
        "fixture.fixture.date": { $gte: yesterday.toISOString() }
      }
    },
    {
      $project: {
        fixtureId: 1,
        "fixture.fixture": 1,
        "fixture.league": 1,
        "fixture.teams": 1,
        "fixture.goals": 1,
        "fixture.score": 1,
        "fixture.status": 1,
        livescore: 1,
        predictionTip: 1,
      }
    },
    {
      $sort: {
        "fixture.league.country": 1,
        "fixture.league.name": 1,
        "fixture.fixture.date": 1
      }
    }
  ]);

  const orderedLive = sortDocsByCountryLeagueKickoff(
    liveFixtures.filter(f => !f.fixture?.league?.name?.toLowerCase().includes("friendlies"))
  );

  const sortedPredictedLiveDocs = await applyPredictionFilter(orderedLive);

  const grouped = {};
  sortedPredictedLiveDocs.forEach((doc) => {
    const league = doc.fixture.league;
    const leagueId = league.id;

    if (!grouped[leagueId]) {
      grouped[leagueId] = {
        league: {
          id: league.id,
          name: league.name,
          logo: league.logo,
          country: league.country
        },
        matches: []
      };
    }

    grouped[leagueId].matches.push(formatFixtureCard(doc));
  });

  return sortLeagueGroups(Object.values(grouped));
}

// -----------------------------------------
// NEW PREDICTION LOGIC FOR FILTERED CARDS
// -----------------------------------------
const calculateStats = (matches, limit) => {
  const recent = matches.slice(0, limit);
  let stats = {
      total: 0,
      over15: 0, under15: 0,
      over25: 0, under25: 0,
      over35: 0, under35: 0,
      btts: 0,
  };

  recent.forEach((m) => {
      const homeGoals = m.fixture?.goals?.home ?? m.fixture?.score?.fulltime?.home;
      const awayGoals = m.fixture?.goals?.away ?? m.fixture?.score?.fulltime?.away;
      
      if (homeGoals !== undefined && homeGoals !== null && awayGoals !== undefined && awayGoals !== null) {
          const totalGoals = homeGoals + awayGoals;
          stats.total++;
          if (totalGoals > 1.5) stats.over15++; else stats.under15++;
          if (totalGoals > 2.5) stats.over25++; else stats.under25++;
          if (totalGoals > 3.5) stats.over35++; else stats.under35++;
          if (homeGoals > 0 && awayGoals > 0) stats.btts++;
      }
  });

  return stats;
};

const calculateWDL = (matches, teamId) => {
  let stats = { total: 0, wins: 0, draws: 0, losses: 0 };
  
  matches.forEach(m => {
      const hId = m.fixture.teams.home.id;
      const aId = m.fixture.teams.away.id;
      const hGoals = m.fixture?.goals?.home ?? m.fixture?.score?.fulltime?.home;
      const aGoals = m.fixture?.goals?.away ?? m.fixture?.score?.fulltime?.away;
      
      if (hGoals !== undefined && aGoals !== undefined && hGoals !== null && aGoals !== null) {
          stats.total++;
          const isHome = (teamId === hId);
          const teamGoals = isHome ? hGoals : aGoals;
          const oppGoals = isHome ? aGoals : hGoals;
          
          if (teamGoals > oppGoals) stats.wins++;
          else if (teamGoals < oppGoals) stats.losses++;
          else stats.draws++;
      }
  });
  return stats;
};

// In-memory cache for prediction calculations.
// Since historical matches (before kickoff) never change, the prediction tip for a specific fixture ID is mathematically immutable.
export const predictionTipCache = new Map(); // Key: fixtureId, Value: "OV1.5" | "UN3.5" | "NONE"

export function clearPredictionCache() {
  predictionTipCache.clear();
}

async function getRecentMatchesForTeam(teamId, matchDate, limit, leagueId = null) {
  const queryBase = {
      "fixture.fixture.date": { $lt: matchDate },
      "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
  };
  
  if (leagueId) {
      queryBase["fixture.league.id"] = leagueId;
  }
  
  const [homeMatches, awayMatches] = await Promise.all([
      Fixture.find({ ...queryBase, "fixture.teams.home.id": teamId })
             .sort({ "fixture.fixture.date": -1 })
             .limit(limit)
             .lean(),
      Fixture.find({ ...queryBase, "fixture.teams.away.id": teamId })
             .sort({ "fixture.fixture.date": -1 })
             .limit(limit)
             .lean()
  ]);
  
  const merged = [...homeMatches, ...awayMatches];
  merged.sort((a, b) => new Date(b.fixture.fixture.date) - new Date(a.fixture.fixture.date));
  return merged.slice(0, limit);
}

async function applyPredictionFilter(orderedDocs) {
  const predictedDocs = [];
  
  let i = 0;
  for (const doc of orderedDocs) {
      i++;
      const fixtureId = doc.fixtureId;
      console.log(`[Prediction] Processing ${i}/${orderedDocs.length} - FixtureID: ${fixtureId}`);
      
      // 1. Check DB or memory cache first for instant response
      const precalculatedTip = doc.predictionTip || predictionTipCache.get(fixtureId);
      if (precalculatedTip) {
          if (precalculatedTip !== "NONE") {
              doc.tip = precalculatedTip;
              predictedDocs.push(doc);
          }
          continue; // Skip heavy DB queries
      }
      const matchDate = doc.fixture.fixture.date;
      const homeId = doc.fixture.teams.home.id;
      const awayId = doc.fixture.teams.away.id;
      const leagueId = doc.fixture.league.id;

      const [homeMatchesAll, awayMatchesAll] = await Promise.all([
          getRecentMatchesForTeam(homeId, matchDate, 5), // Removed leagueId
          getRecentMatchesForTeam(awayId, matchDate, 5)  // Removed leagueId
      ]);

      const homeStatsAll = calculateStats(homeMatchesAll, 5);
      const awayStatsAll = calculateStats(awayMatchesAll, 5);

      let passOV15 = false, passUN35 = false;

      // All-competitions logic
      if (homeStatsAll.total >= 4 && awayStatsAll.total >= 4) {
          passOV15 = homeStatsAll.over25 >= 4 && awayStatsAll.over25 >= 4 &&
                     homeStatsAll.under15 === 0 && awayStatsAll.under15 === 0;
          passUN35 = homeStatsAll.under25 >= 4 && awayStatsAll.under25 >= 4 &&
                     homeStatsAll.over35 === 0 && awayStatsAll.over35 === 0;
      }

      let tip = null;
      if (passOV15) tip = "OV1.5";
      else if (passUN35) tip = "UN3.5";

      if (tip) {
              doc.tip = tip;
              predictionTipCache.set(fixtureId, tip);
              predictedDocs.push(doc);
              // Save permanently to database
              await Fixture.updateOne({ fixtureId: doc.fixtureId }, { $set: { predictionTip: tip } }).catch(console.error);
              continue;
      }

      // If it failed the algorithm, cache it as "NONE" so we never query the DB for this fixture again
      predictionTipCache.set(fixtureId, "NONE");
      await Fixture.updateOne({ fixtureId: doc.fixtureId }, { $set: { predictionTip: "NONE" } }).catch(console.error);
  }

  // Re-sort the predicted docs since Promise.all doesn't guarantee order of push
  return sortDocsByCountryLeagueKickoff(predictedDocs);
}

export async function getPredictedFixturesGroupedByLeague(date) {
  if (!date) throw new Error("Date parameter is required");

  const startOfDayKenya = new Date(`${date}T00:00:00+03:00`);
  const endOfDayKenya = new Date(`${date}T23:59:59.999+03:00`);

  const matchFilter = {
    "fixture.fixture.date": {
      $gte: startOfDayKenya.toISOString(),
      $lte: endOfDayKenya.toISOString()
    }
  };

  const fixtures = await Fixture.aggregate([
    { $match: matchFilter },
    {
      $project: {
        fixtureId: 1,
        "fixture.id": 1,
        "fixture.name": 1,
        "fixture.logo": 1,
        "fixture.country": 1,
        "fixture.fixture": 1,
        "fixture.league": 1,
        "fixture.teams": 1,
        "fixture.goals": 1,
        "fixture.score": 1,
        "fixture.status": 1,
        "livescore": 1,
        predictionTip: 1,
      }
    },
    {
      $lookup: {
        from: "vipfixtures",
        localField: "fixtureId",
        foreignField: "fixtureId",
        as: "vipData"
      }
    },
    {
      $unwind: {
        path: "$vipData",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $sort: {
        "fixture.league.country": 1,
        "fixture.league.name": 1,
        "fixture.fixture.date": 1
      }
    }
  ]);

  const validFixtures = fixtures.filter((f) => {
    if (f.fixture?.league?.name?.toLowerCase().includes("friendlies")) {
      return false;
    }
    // Drop NS matches that are 30+ mins past scheduled kickoff
    if (f.fixture?.fixture?.status?.short === "NS" && f.fixture?.fixture?.date) {
      const kickoff = new Date(f.fixture.fixture.date).getTime();
      const now = new Date().getTime();
      const diffMins = (now - kickoff) / (1000 * 60);
      if (diffMins > 30) {
        return false;
      }
    }
    return true;
  });

  const orderedDocs = sortDocsByCountryLeagueKickoff(validFixtures);

  const sortedPredictedDocs = await applyPredictionFilter(orderedDocs);

  const grouped = {};
  sortedPredictedDocs.forEach(doc => {
    const league = doc.fixture.league;
    const leagueId = league.id;

    if (!grouped[leagueId]) {
      grouped[leagueId] = {
        league: {
          id: league.id,
          name: league.name,
          logo: league.logo,
          country: league.country
        },
        matches: []
      };
    }

    grouped[leagueId].matches.push(formatFixtureCard(doc));
  });

  return sortLeagueGroups(Object.values(grouped));
}
