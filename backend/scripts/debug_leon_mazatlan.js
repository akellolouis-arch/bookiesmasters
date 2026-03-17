import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import Fixture from "../models/Fixture.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const TIMEZONE = "Africa/Nairobi";

function kenyaDateString(d) {
  return d.toLocaleDateString("en-CA", { timeZone: TIMEZONE });
}

async function main() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI not set (.env.local or .env).");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB\n");

  const now = new Date();
  const dateStr = kenyaDateString(now);
  const start = new Date(`${dateStr}T00:00:00+03:00`);
  const end = new Date(`${dateStr}T23:59:59.999+03:00`);
  const startMinus12h = new Date(start.getTime() - 12 * 60 * 60 * 1000);
  const endPlus12h = new Date(end.getTime() + 12 * 60 * 60 * 1000);

  console.log(`Kenya day: ${dateStr}`);
  console.log(`Query window (UTC ISO): ${start.toISOString()} -> ${end.toISOString()}\n`);

  // 1) Pull all fixtures for the Kenya day (same as cards) and then filter in-memory
  // This avoids missing matches due to slight naming/country differences.
  const todays = await Fixture.find({
    "fixture.fixture.date": { $gte: start.toISOString(), $lte: end.toISOString() },
  })
    .lean()
    .select(
      [
        "fixtureId",
        "fixture.league",
        "fixture.teams",
        "fixture.fixture.status",
        "fixture.fixture.date",
        "fixture.goals",
        "fixture.score",
        "livescore",
        "lastLiveUpdate",
        "status",
        "updatedAt",
      ].join(" ")
    );

  const normalize = (s) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  const matchesByName = todays.filter((f) => {
    const fx = f.fixture;
    const home = normalize(fx?.teams?.home?.name);
    const away = normalize(fx?.teams?.away?.name);
    const league = normalize(fx?.league?.name);
    const country = normalize(fx?.league?.country);
    return (
      home.includes("leon") ||
      away.includes("leon") ||
      home.includes("mazatlan") ||
      away.includes("mazatlan") ||
      league.includes("mexico") ||
      country.includes("mexico")
    );
  });

  console.log(`Total fixtures today in DB: ${todays.length}`);
  console.log(`Candidates (name/league/country contains leon/mazatlan/mexico): ${matchesByName.length}\n`);

  const exact = matchesByName.filter((f) => {
    const fx = f.fixture;
    const home = normalize(fx?.teams?.home?.name);
    const away = normalize(fx?.teams?.away?.name);
    return (home.includes("leon") && away.includes("mazatlan")) || (home.includes("mazatlan") && away.includes("leon"));
  });

  if (exact.length > 0) {
    console.log(`✅ Found ${exact.length} exact Leon vs Mazatlan fixture(s) today:\n`);
    for (const f of exact) {
      const fx = f.fixture;
      console.log("-------------");
      console.log(`fixtureId: ${f.fixtureId}`);
      console.log(`${fx?.teams?.home?.name} vs ${fx?.teams?.away?.name}`);
      console.log(`League: ${fx?.league?.name} (${fx?.league?.country})`);
      console.log(`Kickoff: ${fx?.fixture?.date}`);
      console.log("fixture.fixture.status:", fx?.fixture?.status);
      console.log("cached status field:", f.status);
      console.log("fixture.goals:", fx?.goals);
      console.log("fixture.score:", fx?.score);
      console.log("livescore:", f.livescore);
      console.log("lastLiveUpdate:", f.lastLiveUpdate);
      console.log("updatedAt:", f.updatedAt);
    }
  } else {
    console.log("❌ No exact Leon vs Mazatlan match found today by substring match.");
    console.log("Showing up to 30 Mexico candidates (to locate naming differences):\n");
    matchesByName
      .slice(0, 30)
      .forEach((f) => {
        const fx = f.fixture;
        console.log(
          `${f.fixtureId} | ${fx?.teams?.home?.name} vs ${fx?.teams?.away?.name} | ${fx?.league?.country} | ${fx?.league?.name} | ${fx?.fixture?.status?.short} ${fx?.fixture?.status?.elapsed ?? ""}`
        );
      });
  }

  // If we saw the fixture in the candidate list, print full details for it
  const candidateId = matchesByName.find((f) => {
    const fx = f.fixture;
    const home = normalize(fx?.teams?.home?.name);
    const away = normalize(fx?.teams?.away?.name);
    return (home.includes("leon") && away.includes("mazatlan")) || (home.includes("mazatlan") && away.includes("leon"));
  })?.fixtureId;

  if (candidateId) {
    const doc = await Fixture.findOne({ fixtureId: candidateId })
      .lean()
      .select(
        [
          "fixtureId",
          "fixture.league",
          "fixture.teams",
          "fixture.fixture.status",
          "fixture.fixture.date",
          "fixture.goals",
          "fixture.score",
          "livescore",
          "lastLiveUpdate",
          "status",
          "updatedAt",
        ].join(" ")
      );

    const fx = doc?.fixture;
    console.log("\n✅ Full DB snapshot for Leon vs Mazatlan candidate:");
    console.log("-------------");
    console.log(`fixtureId: ${doc?.fixtureId}`);
    console.log(`${fx?.teams?.home?.name} vs ${fx?.teams?.away?.name}`);
    console.log(`League: ${fx?.league?.name} (${fx?.league?.country})`);
    console.log(`Kickoff: ${fx?.fixture?.date}`);
    console.log("fixture.fixture.status:", fx?.fixture?.status);
    console.log("cached status field:", doc?.status);
    console.log("fixture.goals:", fx?.goals);
    console.log("fixture.score:", fx?.score);
    console.log("livescore:", doc?.livescore);
    console.log("lastLiveUpdate:", doc?.lastLiveUpdate);
    console.log("updatedAt:", doc?.updatedAt);
  }

  const fixtures = await Fixture.find({
    // widen a bit in case of timezone offsets or data stored slightly outside Kenya day bounds
    "fixture.fixture.date": { $gte: startMinus12h.toISOString(), $lte: endPlus12h.toISOString() },
    "fixture.league.country": /mexico/i,
    $and: [
      {
        $or: [
          { "fixture.teams.home.name": /leon/i },
          { "fixture.teams.away.name": /leon/i },
        ],
      },
      {
        $or: [
          { "fixture.teams.home.name": /mazatlan/i },
          { "fixture.teams.away.name": /mazatlan/i },
        ],
      },
    ],
  })
    .lean()
    .select(
      [
        "fixtureId",
        "fixture.league",
        "fixture.teams",
        "fixture.fixture.status",
        "fixture.fixture.date",
        "fixture.goals",
        "fixture.score",
        "livescore",
        "lastLiveUpdate",
        "status",
        "updatedAt",
      ].join(" ")
    );

  if (!fixtures.length) {
    console.log("❌ No matching fixtures found for Leon vs Mazatlan today.");
    console.log("\nTrying broader search by team names only (last 7 days)...");

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fallback = await Fixture.find({
      "fixture.fixture.date": { $gte: sevenDaysAgo.toISOString(), $lte: endPlus12h.toISOString() },
      $and: [
        {
          $or: [
            { "fixture.teams.home.name": /leon/i },
            { "fixture.teams.away.name": /leon/i },
          ],
        },
        {
          $or: [
            { "fixture.teams.home.name": /mazatlan/i },
            { "fixture.teams.away.name": /mazatlan/i },
          ],
        },
      ],
    })
      .lean()
      .select(
        [
          "fixtureId",
          "fixture.league",
          "fixture.teams",
          "fixture.fixture.status",
          "fixture.fixture.date",
          "fixture.goals",
          "fixture.score",
          "livescore",
          "lastLiveUpdate",
          "status",
          "updatedAt",
        ].join(" ")
      )
      .limit(10);

    if (!fallback.length) {
      console.log("❌ Still nothing found. Possible causes:");
      console.log("- Team names in DB differ (e.g. accents/abbreviations).");
      console.log("- Fixture not saved into our MongoDB.");
      console.log("- League/country fields differ from expected.");
    } else {
      console.log(`✅ Found ${fallback.length} candidate fixture(s) in last 7 days:\n`);
      for (const f of fallback) {
        const fx = f.fixture;
        console.log("-------------");
        console.log(`fixtureId: ${f.fixtureId}`);
        console.log(`${fx?.teams?.home?.name} vs ${fx?.teams?.away?.name}`);
        console.log(`League: ${fx?.league?.name} (${fx?.league?.country})`);
        console.log(`Kickoff: ${fx?.fixture?.date}`);
        console.log("fixture.fixture.status:", fx?.fixture?.status);
        console.log("cached status field:", f.status);
        console.log("fixture.goals:", fx?.goals);
        console.log("fixture.score:", fx?.score);
        console.log("livescore:", f.livescore);
        console.log("lastLiveUpdate:", f.lastLiveUpdate);
        console.log("updatedAt:", f.updatedAt);
      }
    }
  } else {
    for (const f of fixtures) {
      const fx = f.fixture;
      console.log("-------------");
      console.log(`fixtureId: ${f.fixtureId}`);
      console.log(`${fx?.teams?.home?.name} vs ${fx?.teams?.away?.name}`);
      console.log(`League: ${fx?.league?.name} (${fx?.league?.country})`);
      console.log(`Kickoff: ${fx?.fixture?.date}`);
      console.log("fixture.fixture.status:", fx?.fixture?.status);
      console.log("cached status field:", f.status);
      console.log("fixture.goals:", fx?.goals);
      console.log("fixture.score:", fx?.score);
      console.log("livescore:", f.livescore);
      console.log("lastLiveUpdate:", f.lastLiveUpdate);
      console.log("updatedAt:", f.updatedAt);
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

