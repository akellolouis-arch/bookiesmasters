import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

async function findFixture() {
    try {
        console.log(`Searching for Palmeiras vs Vitoria...`);
        // Searching for Palmeiras (id: 121) and Vitoria (id: 134 or similar, search by name might be easier if we don't know IDs)
        // Let's search by team name in the "next 50" maybe? Or just search fixtures for a specific date if we knew it.
        // Better: Search for team "Palmeiras" next matches.

        // First get team ID for Palmeiras if we don't know it, but usually it's 121 in Brazil Serie A.
        // Let's just search fixtures for team=121 (Palmeiras) and season=2024 or 2025.
        // Or simpler: /fixtures?team=121&next=10

        // Wait, I don't know Palmeiras ID for sure. Let's search team first.

        const teamRes = await axios.get(`${BASE_URL}/teams`, {
            params: { search: "Palmeiras" },
            headers: { "x-apisports-key": API_KEY }
        });

        const palmeirasId = teamRes.data.response[0].team.id;
        console.log(`Palmeiras ID: ${palmeirasId}`);

        const fixturesRes = await axios.get(`${BASE_URL}/fixtures`, {
            params: { team: palmeirasId, next: 10 },
            headers: { "x-apisports-key": API_KEY }
        });

        const fixtures = fixturesRes.data.response;
        // console.log(fixtures);

        const match = fixtures.find(f =>
        (f.teams.home.name.includes("Vitória") || f.teams.away.name.includes("Vitória") ||
            f.teams.home.name.includes("Vitoria") || f.teams.away.name.includes("Vitoria"))
        );

        if (match) {
            console.log(`Found match: ${match.teams.home.name} vs ${match.teams.away.name}`);
            console.log(`Fixture ID: ${match.fixture.id}`);
            console.log(`Date: ${match.fixture.date}`);
            console.log(`Status: ${match.fixture.status.long}`);
        } else {
            // Maybe it was recent?
            const recentRes = await axios.get(`${BASE_URL}/fixtures`, {
                params: { team: palmeirasId, last: 10 },
                headers: { "x-apisports-key": API_KEY }
            });
            const match2 = recentRes.data.response.find(f =>
            (f.teams.home.name.includes("Vitória") || f.teams.away.name.includes("Vitória") ||
                f.teams.home.name.includes("Vitoria") || f.teams.away.name.includes("Vitoria"))
            );

            if (match2) {
                console.log(`Found PAST match: ${match2.teams.home.name} vs ${match2.teams.away.name}`);
                console.log(`Fixture ID: ${match2.fixture.id}`);
            } else {
                console.log("Match not found in next 10 or last 10.");
            }
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
}

findFixture();
