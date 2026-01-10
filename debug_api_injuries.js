
import fs from "fs";
import path from "path";

// Manual .env loading
function loadEnv() {
    try {
        const envPath = 'C:\\Users\\Administrator\\projects\\bookiesmasters\\backend\\.env';
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8');
            envConfig.split('\n').forEach(line => {
                const parts = line.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
                    if (key && !key.startsWith('#')) {
                        process.env[key] = value;
                    }
                }
            });
        }
    } catch (e) { console.error(e); }
}

loadEnv();

async function findFixture() {
    try {
        const API_KEY = process.env.API_KEY;
        if (!API_KEY) {
            console.error("❌ API_KEY not found.");
            return;
        }

        const today = "2026-01-09";
        const season = 2025;

        console.log(`🔎 Searching for Frankfurt vs Dortmund on ${today} (Season ${season})...`);

        // Search by date. We don't need a team ID if searching by general date, but we can filter results.
        const url = `https://v3.football.api-sports.io/fixtures?date=${today}&season=${season}`;

        const res = await fetch(url, {
            headers: { "x-apisports-key": API_KEY }
        });

        const data = await res.json();

        if (data.errors && Object.keys(data.errors).length > 0) {
            console.error("API Error:", data.errors);
            return;
        }

        const fixtures = data.response;

        // Find Frankfurt vs Dortmund
        const match = fixtures.find(f =>
            (f.teams.home.name.includes("Frankfurt") && f.teams.away.name.includes("Dortmund")) ||
            (f.teams.away.name.includes("Frankfurt") && f.teams.home.name.includes("Dortmund"))
        );

        if (match) {
            console.log(`\n✅ FOUND MATCH:`);
            console.log(`ID: ${match.fixture.id}`);
            console.log(`${match.teams.home.name} vs ${match.teams.away.name}`);
            console.log(`Status: ${match.fixture.status.long}`);

            // Now fetch injuries for this ID
            await fetchInjuries(match.fixture.id, API_KEY);
        } else {
            console.log(`❌ Frankfurt vs Dortmund match not found for ${today}.`);
            // List bundesliga matches loosely?
            console.log("Found matches (sample):");
            fixtures.slice(0, 5).forEach(f => {
                console.log(`${f.teams.home.name} vs ${f.teams.away.name}`);
            });
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

async function fetchInjuries(fixtureId, apiKey) {
    console.log(`\n🚑 Fetching Injuries for Fixture ${fixtureId}...`);
    try {
        const url = `https://v3.football.api-sports.io/injuries?fixture=${fixtureId}`;
        const res = await fetch(url, {
            headers: { "x-apisports-key": apiKey }
        });

        const data = await res.json();
        const injuries = data.response;
        console.log(`Total Injuries Found in API: ${injuries.length}`);

        const teams = {};
        injuries.forEach(i => {
            if (!teams[i.team.name]) teams[i.team.name] = [];
            teams[i.team.name].push({
                name: i.player.name,
                type: i.player.type,
                reason: i.player.reason
            });
        });

        Object.keys(teams).forEach(team => {
            console.log(`\nTeam: ${team} (${teams[team].length})`);
            teams[team].forEach(p => console.log(` - ${p.name} (${p.reason})`));
        });

        if (injuries.length === 0) {
            console.log("⚠️ The API returned 0 injuries. API-Football has no data for this match.");
        }

    } catch (error) {
        console.error("Error fetching injuries:", error);
    }
}

findFixture();
