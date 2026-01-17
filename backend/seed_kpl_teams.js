import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Team from './models/Team.js';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const KPL_TEAMS = [
    { name: "Gor Mahia", city: "Nairobi", venue: "Moi International Sports Centre", lat: -1.22806, lon: 36.89056 },
    { name: "AFC Leopards", city: "Nairobi", venue: "Nyayo National Stadium", lat: -1.30361, lon: 36.82417 },
    { name: "Tusker FC", city: "Nairobi", venue: "Kasarani Annex", lat: -1.2254, lon: 36.8976 },
    { name: "Kenya Police FC", city: "Nairobi", venue: "Police Sacco Stadium", lat: -1.2789, lon: 36.8850 },
    { name: "KCB FC", city: "Nairobi", venue: "Ulinzi Sports Complex", lat: -1.3323, lon: 36.7865 },
    { name: "Ulinzi Stars", city: "Nairobi", venue: "Ulinzi Sports Complex", lat: -1.3323, lon: 36.7865 },
    { name: "Kariobangi Sharks", city: "Nairobi", venue: "Kasarani Annex", lat: -1.2254, lon: 36.8976 },
    { name: "Bandari FC", city: "Mombasa", venue: "Mbaraki Sports Club", lat: -4.0673, lon: 39.6644 },
    { name: "Kakamega Homeboyz", city: "Kakamega", venue: "Bukhungu Stadium", lat: 0.28944, lon: 34.76028 },
    { name: "Posta Rangers", city: "Machakos", venue: "Kenyatta Stadium", lat: -1.519722, lon: 37.264444 },
    { name: "Bidco United", city: "Thika", venue: "Thika Stadium", lat: -1.0333, lon: 37.0693 },
    { name: "Sofapaka FC", city: "Nairobi", venue: "Dandora Stadium", lat: -1.245, lon: 36.90579 },
    { name: "Mathare United", city: "Nairobi", venue: "Dandora Stadium", lat: -1.245, lon: 36.90579 },
    { name: "Talanta FC", city: "Nairobi", venue: "Nyayo National Stadium", lat: -1.30361, lon: 36.82417 },
    { name: "Murang'a SEAL", city: "Muranga", venue: "St. Sebastian Park", lat: -0.7303, lon: 37.1352 },
    { name: "Shabana FC", city: "Kisii", venue: "Gusii Stadium", lat: -0.6769, lon: 34.7693 },
    { name: "Muhoroni Youth", city: "Muhoroni", venue: "Muhoroni Stadium", lat: -0.155, lon: 35.200 },
    { name: "Nzoia Sugar", city: "Bungoma", venue: "Sudi Stadium", lat: 0.5694, lon: 34.5606 },
    { name: "Mara Sugar FC", city: "Awendo", venue: "Green Stadium Awendo", lat: -0.895, lon: 34.533611 },
];

// Helper to fetch Team ID from your Database or API
// Since we don't know the exact IDs in your DB, we'll fuzzy match by Name
// or we can fetch them from API-Football. 
// For now, let's look them up in the DB first using regex match.

async function seedTeams() {
    try {
        if (!process.env.MONGO_URI) throw new Error("Missing MONGO_URI");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ DB Connected");

        // We assume team documents might NOT exist yet if they haven't been cached.
        // But for Distance to work, we need to associate Name -> Coordinates.
        // The fixtureService tries to find the team by ID. 
        // We need to Find the Team ID first. 
        // Strategy: Search Fixture collection for these teams to find their IDs.

        console.log("🔍 Looking up Team IDs in active fixtures...");

        for (const kplTeam of KPL_TEAMS) {
            // Find a fixture involving this team to get its ID
            const fixture = await mongoose.connection.collection('fixtures').findOne({
                $or: [
                    { "fixture.teams.home.name": { $regex: new RegExp(kplTeam.name, "i") } },
                    { "fixture.teams.away.name": { $regex: new RegExp(kplTeam.name, "i") } }
                ]
            });

            if (fixture) {
                const isHome = new RegExp(kplTeam.name, "i").test(fixture.fixture.teams.home.name);
                const teamData = isHome ? fixture.fixture.teams.home : fixture.fixture.teams.away;

                console.log(`✅ Found ID for ${kplTeam.name}: ${teamData.id}`);

                await Team.findOneAndUpdate(
                    { teamId: teamData.id },
                    {
                        teamId: teamData.id,
                        name: teamData.name, // Use official API name
                        city: kplTeam.city,
                        venueName: kplTeam.venue,
                        coordinates: {
                            lat: kplTeam.lat,
                            lon: kplTeam.lon
                        },
                        logo: teamData.logo,
                        country: "Kenya"
                    },
                    { upsert: true, new: true }
                );
            } else {
                console.log(`⚠️ Could not find fixture for ${kplTeam.name} to get ID. skipped.`);
            }
        }

        console.log("🎉 Seeding Complete!");

    } catch (e) {
        console.error("❌ Error:", e);
    } finally {
        await mongoose.disconnect();
    }
}

seedTeams();
