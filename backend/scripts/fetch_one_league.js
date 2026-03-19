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

  const url = new URL("https://v3.football.api-sports.io/leagues");
  url.searchParams.set("id", "39"); // Premier League

  const res = await fetch(url, { headers: { "x-apisports-key": key } });
  const data = await res.json();
  const one = data?.response?.[0] ?? null;

  // Print a single league response object (no secrets).
  console.log(JSON.stringify(one, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

