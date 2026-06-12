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

  // Filter out friendlies
  const validFixtures = fixtures.filter((f) => {
    if (f.fixture?.league?.name?.toLowerCase().includes("friendlies")) {
      return false;
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

  const liveFixtures = await Fixture.aggregate([
    {
      $match: {
        "fixture.fixture.status.short": { $in: LIVE_STATUSES }
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

  const grouped = {};
  orderedLive.forEach((doc) => {
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
      over25: 0, under25: 0,
  };

  recent.forEach((m) => {
      const homeGoals = m.fixture?.goals?.home ?? m.fixture?.score?.fulltime?.home;
      const awayGoals = m.fixture?.goals?.away ?? m.fixture?.score?.fulltime?.away;
      
      if (homeGoals !== undefined && homeGoals !== null && awayGoals !== undefined && awayGoals !== null) {
          const totalGoals = homeGoals + awayGoals;
          stats.total++;
          if (totalGoals > 2.5) stats.over25++; else stats.under25++;
      }
  });

  return stats;
};

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
    return true;
  });

  const orderedDocs = sortDocsByCountryLeagueKickoff(validFixtures);

  // Filter using prediction logic (run in parallel)
  const predictedDocs = [];
  
  await Promise.all(orderedDocs.map(async (doc) => {
      const matchDate = doc.fixture.fixture.date;
      const homeId = doc.fixture.teams.home.id;
      const awayId = doc.fixture.teams.away.id;

      const [homeMatches, awayMatches, h2hMatches] = await Promise.all([
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
              $or: [
                  { "fixture.teams.home.id": homeId, "fixture.teams.away.id": awayId },
                  { "fixture.teams.home.id": awayId, "fixture.teams.away.id": homeId }
              ],
              "fixture.fixture.date": { $lt: matchDate },
              "fixture.fixture.status.short": { $in: ["FT", "AET", "PEN"] }
          }).sort({ "fixture.fixture.date": -1 }).limit(5)
      ]);

      const homeStats = calculateStats(homeMatches, 5);
      const awayStats = calculateStats(awayMatches, 5);
      const h2hStats = calculateStats(h2hMatches, 5);

      if (homeStats.total > 0 && awayStats.total > 0) {
          const passOV25 = homeStats.over25 >= homeStats.under25 && awayStats.over25 >= awayStats.under25;
          const passUN25 = homeStats.under25 >= homeStats.over25 && awayStats.under25 >= awayStats.over25;
          
          if (passOV25 || passUN25) {
              doc.tip = passOV25 ? "OV1.5" : "UN3.5";
              predictedDocs.push(doc);
          }
      }
  }));

  // Re-sort the predicted docs since Promise.all doesn't guarantee order of push
  const sortedPredictedDocs = sortDocsByCountryLeagueKickoff(predictedDocs);

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
