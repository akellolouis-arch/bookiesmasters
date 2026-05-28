import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const BASE_URL = "https://v3.football.api-sports.io";

async function checkTeam(teamId) {
    const url = new URL(`${BASE_URL}/fixtures`);
    url.searchParams.set("team", String(teamId));
    url.searchParams.set("season", "2024");
    
    let res = await fetch(url, { headers: { "x-apisports-key": process.env.API_KEY } });
    let data = await res.json();
    
    if (data.response && data.response.length > 0) {
        console.log(`Team ${teamId} 2024 Leagues:`);
        const leagues = new Set();
        data.response.forEach(f => {
            leagues.add(`${f.league.name} (${f.league.id})`);
        });
        leagues.forEach(l => console.log(l));
    }
    process.exit(0);
}

checkTeam(4671);
