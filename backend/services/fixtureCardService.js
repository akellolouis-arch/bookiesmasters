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
const predictionTipCache = new Map(); // Key: fixtureId, Value: "OV1.5" | "UN3.5" | "NONE"

async function applyPredictionFilter(orderedDocs) {
  const predictedDocs = [];
  
  await Promise.all(orderedDocs.map(async (doc) => {
      const fixtureId = doc.fixture.id;
      
      // 1. Check DB or memory cache first for instant response
      const precalculatedTip = doc.predictionTip || predictionTipCache.get(fixtureId);
      if (precalculatedTip) {
          if (precalculatedTip !== "NONE") {
              doc.tip = precalculatedTip;
              predictedDocs.push(doc);
          }
          return; // Skip heavy DB queries
      }
      const matchDate = doc.fixture.fixture.date;
      const homeId = doc.fixture.teams.home.id;
      const awayId = doc.fixture.teams.away.id;
      const leagueId = doc.fixture.league.id;

      const [homeMatchesAll, awayMatchesAll, homeMatchesLeague, awayMatchesLeague] = await Promise.all([
          Fixture.find({
              $or: [{ "fixture.teams.home.id": homeId }, { "fixture.teams.away.id": homeId }],
              "fixture.fixture.date": { $lt: matchDate },
              "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
          }).sort({ "fixture.fixture.date": -1 }).limit(5),
          Fixture.find({
              $or: [{ "fixture.teams.home.id": awayId }, { "fixture.teams.away.id": awayId }],
              "fixture.fixture.date": { $lt: matchDate },
              "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
          }).sort({ "fixture.fixture.date": -1 }).limit(5),
          Fixture.find({
              "fixture.league.id": leagueId,
              $or: [{ "fixture.teams.home.id": homeId }, { "fixture.teams.away.id": homeId }],
              "fixture.fixture.date": { $lt: matchDate },
              "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
          }).sort({ "fixture.fixture.date": -1 }).limit(5),
          Fixture.find({
              "fixture.league.id": leagueId,
              $or: [{ "fixture.teams.home.id": awayId }, { "fixture.teams.away.id": awayId }],
              "fixture.fixture.date": { $lt: matchDate },
              "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
          }).sort({ "fixture.fixture.date": -1 }).limit(5)
      ]);

      const homeStatsAll = calculateStats(homeMatchesAll, 5);
      const awayStatsAll = calculateStats(awayMatchesAll, 5);
      
      const homeStatsLeague = calculateStats(homeMatchesLeague, 5);
      const awayStatsLeague = calculateStats(awayMatchesLeague, 5);
      const homeFormLeague = calculateWDL(homeMatchesLeague, homeId);
      const awayFormLeague = calculateWDL(awayMatchesLeague, awayId);

      let passHomeWin = false, passAwayWin = false, passOV25 = false, passBTTS = false, passUN25 = false;
      let passOV15 = false, passUN35 = false;

      // League specific logic
      if (homeStatsLeague.total >= 4 && awayStatsLeague.total >= 4) {
          passHomeWin = homeFormLeague.wins >= 4 && awayFormLeague.losses >= 4;
          passAwayWin = awayFormLeague.wins >= 4 && homeFormLeague.losses >= 4;
          passOV25 = homeStatsLeague.over35 >= 4 && awayStatsLeague.over35 >= 4;
          passBTTS = homeStatsLeague.btts >= 4 && awayStatsLeague.btts >= 4 && homeStatsLeague.over35 >= 4 && awayStatsLeague.over35 >= 4;
          passUN25 = homeStatsLeague.under15 >= 4 && awayStatsLeague.under15 >= 4;
      }

      // All competitions logic
      if (homeStatsAll.total >= 4 && awayStatsAll.total >= 4) {
          passOV15 = homeStatsAll.over25 >= 4 && awayStatsAll.over25 >= 4;
          passUN35 = homeStatsAll.under25 >= 4 && awayStatsAll.under25 >= 4;
      }

      let tip = null;
      if (passHomeWin) tip = "1";
      else if (passAwayWin) tip = "2";
      else if (passOV25) tip = "OV2.5";
      else if (passBTTS) tip = "BTTS";
      else if (passUN25) tip = "UN2.5";
      else if (passOV15) tip = "OV1.5";
      else if (passUN35) tip = "UN3.5";

      if (tip) {
              doc.tip = tip;
              predictionTipCache.set(fixtureId, tip);
              predictedDocs.push(doc);
              // Save permanently to database
              await Fixture.updateOne({ fixtureId: doc.fixtureId }, { $set: { predictionTip: tip } }).catch(console.error);
              return;
      }

      // If it failed the algorithm, cache it as "NONE" so we never query the DB for this fixture again
      predictionTipCache.set(fixtureId, "NONE");
      await Fixture.updateOne({ fixtureId: doc.fixtureId }, { $set: { predictionTip: "NONE" } }).catch(console.error);
  }));

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
