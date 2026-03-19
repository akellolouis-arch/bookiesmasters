import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

function hasDesiredCoverage(leagueObj) {
  const seasons = Array.isArray(leagueObj?.seasons) ? leagueObj.seasons : [];
  const current = seasons.find((s) => s?.current === true) ?? seasons[seasons.length - 1];
  const cov = current?.coverage;
  return Boolean(
    cov &&
      cov.predictions === true &&
      cov.odds === true
  );
}

async function main() {
  const key = process.env.API_KEY;
  if (!key) {
    console.error("API_KEY not found in backend/.env");
    process.exit(1);
  }

  const res = await fetch("https://v3.football.api-sports.io/leagues", {
    headers: { "x-apisports-key": key },
  });
  const data = await res.json();
  const leagues = Array.isArray(data?.response) ? data.response : [];

  const matching = leagues.filter(hasDesiredCoverage);

  console.log(
    JSON.stringify(
      {
        totalReturned: leagues.length,
        matchingCount: matching.length,
        // include a small sample for sanity
        sample: matching.slice(0, 10).map((x) => ({
          id: x?.league?.id,
          name: x?.league?.name,
          country: x?.country?.name,
          currentSeason: (x?.seasons || []).find((s) => s?.current === true)?.year ?? null,
        })),
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

