import Fixture from "../models/Fixture.js";
import { formatFixtureCard } from "../helpers/fixtureFormatter.js";

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
  console.time("DB:FetchFixtures");
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
        "prediction": 1,
        "customPrediction": 1,
        customOdds: 1,
        // ⚡ OPTIMIZATION: Slice Odds immediately! Do not carry 50 bookmakers through pipeline.
        odds: {
          $map: {
            input: { $slice: ["$odds", 1] }, // Take ONLY the 1st bookmaker (usually enough)
            as: "bookmaker",
            in: {
              id: "$$bookmaker.id",
              name: "$$bookmaker.name",
              logo: "$$bookmaker.logo",
              markets: {
                $filter: {
                  input: "$$bookmaker.markets",
                  as: "market",
                  cond: {
                    $or: [
                      { $eq: ["$$market.name", "Match Winner"] },
                      { $eq: ["$$market.id", 1] }
                    ]
                  }
                }
              }
            }
          }
        }
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
      $sort: { "fixture.league.id": 1, "fixture.fixture.date": 1 }
    },
    {
      $project: {
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
        "fixtureId": 1,

        // MERGE VIP DATA (Override defaults)
        "isVip": { $literal: false }, // Force False
        "creditCost": { $literal: 0 },
        "prediction": { $ifNull: ["$customPrediction", "$prediction"] },
        "customOdds": "$customOdds",

        "odds": {
          $map: {
            input: { $slice: ["$odds", 1] }, // Take 1st bookmaker
            as: "bookmaker",
            in: {
              id: "$$bookmaker.id",
              name: "$$bookmaker.name",
              logo: "$$bookmaker.logo",
              markets: {
                $filter: {
                  input: "$$bookmaker.markets", // Iterate over markets
                  as: "market",
                  cond: {
                    // Check specific name or ID (1=Match Winner)
                    $or: [
                      { $eq: ["$$market.name", "Match Winner"] },
                      { $eq: ["$$market.id", 1] }
                    ]
                  }
                }
              }
            }
          }
        }
      }
    }
  ]);
  console.timeEnd("DB:FetchFixtures");

  // Filter out fixtures that **do not have match winner odds**,
  // but ALWAYS include finished or live matches so past results are visible.
  const fixturesWithOdds = fixtures.filter(f => {
    const hasOdds = f.odds && f.odds.length > 0 && f.odds[0].markets && f.odds[0].markets.length > 0;
    const statusShort = f.fixture?.fixture?.status?.short;
    const isPlayedOrLive = statusShort && !["NS", "TBD"].includes(statusShort);
    return hasOdds || isPlayedOrLive;
  });

  // Group by league
  const grouped = {};
  fixturesWithOdds.forEach(doc => {
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

  return Object.values(grouped);
}

export async function getLeagueFixtures(leagueId) {
  const now = new Date();

  // 1. Past Matches (Last 5)
  // We reuse the projection aggregation for efficiency, but we can't easily do two separate sorts in one query.
  // So we'll do two queries or one broad query. 
  // Two queries is cleaner for "Last 5" and "Next 10".

  const projectionStage = {
    $project: {
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
      "fixtureId": 1,
      "odds": {
        $map: {
          input: { $slice: ["$odds", 1] },
          as: "bookmaker",
          in: {
            id: "$$bookmaker.id",
            name: "$$bookmaker.name",
            logo: "$$bookmaker.logo",
            markets: {
              $filter: {
                input: "$$bookmaker.markets",
                as: "market",
                cond: {
                  $or: [
                    { $eq: ["$$market.name", "Match Winner"] },
                    { $eq: ["$$market.id", 1] }
                  ]
                }
              }
            }
          }
        }
      }
    }
  };

  const pastMatches = await Fixture.aggregate([
    { $match: { "fixture.league.id": Number(leagueId), "fixture.fixture.date": { $lt: now.toISOString() } } },
    { $sort: { "fixture.fixture.date": -1 } },
    { $limit: 5 },
    projectionStage
  ]);

  const futureMatches = await Fixture.aggregate([
    { $match: { "fixture.league.id": Number(leagueId), "fixture.fixture.date": { $gte: now.toISOString() } } },
    { $sort: { "fixture.fixture.date": 1 } },
    { $limit: 10 },
    projectionStage
  ]);

  // Format
  return [
    ...pastMatches.reverse().map(formatFixtureCard), // Show oldest -> newest for past? No, usually list down. Keeping array order.
    ...futureMatches.map(formatFixtureCard)
  ];
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
        prediction: 1,
        customPrediction: 1,
        customOdds: 1,
        odds: {
          $map: {
            input: { $slice: ["$odds", 1] },
            as: "bookmaker",
            in: {
              id: "$$bookmaker.id",
              name: "$$bookmaker.name",
              logo: "$$bookmaker.logo",
              markets: {
                $filter: {
                  input: "$$bookmaker.markets",
                  as: "market",
                  cond: {
                    $or: [
                      { $eq: ["$$market.name", "Match Winner"] },
                      { $eq: ["$$market.id", 1] }
                    ]
                  }
                }
              }
            }
          }
        }
      }
    },
    {
      $sort: { "fixture.league.id": 1, "fixture.fixture.date": 1 }
    }
  ]);

  const grouped = {};
  liveFixtures.forEach((doc) => {
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

  return Object.values(grouped);
}
