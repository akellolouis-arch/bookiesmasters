import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

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

  const simplified = leagues.map((r) => ({
    id: r?.league?.id,
    name: r?.league?.name,
    country: r?.country?.name,
  }));

  const wanted = [
    "FA Cup",
    "League Cup",
    "EFL Cup",
    "Carabao Cup",
    "Conference League",
    "Europa Conference League",
    "UEFA Europa Conference League",
  ].map((w) => w.toLowerCase());

  const matches = simplified.filter((n) =>
    wanted.some((w) => (n.name || "").toLowerCase().includes(w))
  );

  console.log(JSON.stringify(matches, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

