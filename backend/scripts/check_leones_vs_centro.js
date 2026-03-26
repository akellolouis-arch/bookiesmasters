import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

async function checkLeonesVsCentro() {
  try {
    console.log("Searching for Leones de Rosario vs Centro Espanol...\n");

    // 1. Get Leones de Rosario team ID
    const teamRes = await axios.get(`${BASE_URL}/teams`, {
      params: { search: "Leones de Rosario" },
      headers: { "x-apisports-key": API_KEY },
    });

    const teams = teamRes.data.response;
    if (!teams.length) {
      console.log("No team 'Leones de Rosario' found.");
      return;
    }

    const leonesId = teams[0].team.id;
    console.log(`Leones de Rosario ID: ${leonesId}`);

    // 2. Get fixtures (last + next) for Leones
    const [lastRes, nextRes] = await Promise.all([
      axios.get(`${BASE_URL}/fixtures`, {
        params: { team: leonesId, last: 15 },
        headers: { "x-apisports-key": API_KEY },
      }),
      axios.get(`${BASE_URL}/fixtures`, {
        params: { team: leonesId, next: 15 },
        headers: { "x-apisports-key": API_KEY },
      }),
    ]);

    const allFixtures = [
      ...(lastRes.data.response || []),
      ...(nextRes.data.response || []),
    ];

    const match = allFixtures.find((f) => {
      const home = (f.teams.home.name || "").toLowerCase();
      const away = (f.teams.away.name || "").toLowerCase();
      const hasLeones = home.includes("leones") && home.includes("rosario");
      const hasCentro =
        away.includes("centro") && (away.includes("espanol") || away.includes("español"));
      return hasLeones && hasCentro;
    });

    if (!match) {
      console.log("Match not found. Listing all fixtures for Leones:\n");
      allFixtures.forEach((f) => {
        console.log(
          `  ${f.fixture.id} | ${f.fixture.date} | ${f.teams.home.name} vs ${f.teams.away.name} | ${f.fixture.status.short}`
        );
      });
      return;
    }

    const id = match.fixture.id;
    console.log(`\n--- FOUND ---`);
    console.log(`Fixture ID: ${id}`);
    console.log(`Date: ${match.fixture.date}`);
    console.log(`Status: ${match.fixture.status.short} (elapsed: ${match.fixture.status.elapsed ?? "N/A"})`);
    console.log(`Score: ${JSON.stringify(match.goals)}`);

    // 3. Re-fetch by ID to get latest status
    console.log("\n--- FRESH API CALL GET /fixtures?id=" + id + " ---\n");
    const detailRes = await axios.get(`${BASE_URL}/fixtures`, {
      params: { id },
      headers: { "x-apisports-key": API_KEY },
    });

    const data = detailRes.data.response[0];
    if (!data) {
      console.log("No data from detail call.");
      return;
    }

    console.log(`Status: ${data.fixture.status.short}`);
    console.log(`Elapsed: ${data.fixture.status.elapsed ?? "N/A"}`);
    console.log(`Long: ${data.fixture.status.long}`);
    console.log(`Score: ${JSON.stringify(data.goals)}`);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

checkLeonesVsCentro();
