import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function fetchLeague(id, key) {
  const url = new URL("https://v3.football.api-sports.io/leagues");
  url.searchParams.set("id", String(id));
  const res = await fetch(url, { headers: { "x-apisports-key": key } });
  const data = await res.json();
  return data?.response?.[0] ?? null;
}

function currentSeason(leagueObj) {
  const seasons = Array.isArray(leagueObj?.seasons) ? leagueObj.seasons : [];
  return seasons.find((s) => s?.current === true) ?? null;
}

async function main() {
  const key = process.env.API_KEY;
  if (!key) {
    console.error("API_KEY not found in backend/.env");
    process.exit(1);
  }

  // Known IDs in API-Football:
  // - FA Cup (England): 45
  // - World Cup (World): 1
  const ids = [45, 1];

  const out = [];
  for (const id of ids) {
    const league = await fetchLeague(id, key);
    const cur = currentSeason(league);
    out.push({
      id,
      name: league?.league?.name ?? null,
      country: league?.country?.name ?? null,
      currentSeasonYear: cur?.year ?? null,
      standings: cur?.coverage?.standings ?? null,
      coverage: cur?.coverage ?? null,
    });
  }

  console.log(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

