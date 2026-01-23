
import axios from "axios";
import TransferCache from "../models/TransferCache.js";

const API_KEY = process.env.API_KEY; // Ensure this is loaded
const API_URL = "https://v3.football.api-sports.io/transfers";

const CACHE_DURATION_DAYS = 7;

// Fetch transfers for a specific team
export const getTeamTransfers = async (teamId) => {
    try {
        const teamIdNum = Number(teamId);

        // 1. Check Cache
        const cached = await TransferCache.findOne({ teamId: teamIdNum });

        if (cached) {
            const now = new Date();
            const diffTime = Math.abs(now - cached.lastUpdated);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < CACHE_DURATION_DAYS) {
                console.log(`✅ Using cached transfers for team ${teamIdNum}`);
                return cached.transfers;
            }
            console.log(`⌛ Cache expired for team ${teamIdNum}, refreshing...`);
        }

        // 2. Fetch from API
        console.log(`🌍 Fetching transfers from API for team ${teamIdNum}`);

        const response = await axios.get(API_URL, {
            headers: {
                "x-rapidapi-host": "v3.football.api-sports.io",
                "x-rapidapi-key": API_KEY
            },
            params: { team: teamIdNum }
        });

        if (response.data.errors && Object.keys(response.data.errors).length > 0) {
            console.error("API Error:", response.data.errors);
            return cached ? cached.transfers : []; // Return stale cache if API fails
        }

        const rawData = response.data.response || [];

        // 3. Process Data
        // The API returns a list of players, and for each player, their transfer history.
        // We want a list of transfers *involving* this team.
        // Structure: [ { player: {...}, transfers: [ {...}, {...} ] }, ... ]

        let allTransfers = [];

        rawData.forEach(entry => {
            const player = entry.player;
            if (!entry.transfers) return;

            entry.transfers.forEach(t => {
                // Check if this specific transfer involves the requested team
                // (Either IN to this team or OUT from this team)
                const teamInId = t.teams.in.id;
                const teamOutId = t.teams.out.id;

                if (teamInId === teamIdNum || teamOutId === teamIdNum) {
                    // Filter by date? 
                    // Let's keep all for now, or maybe limit to last 2-3 years to save space?
                    // The user logic might want to see history. Let's keep recent 3 years for now to be safe.
                    const year = new Date(t.date).getFullYear();
                    const currentYear = new Date().getFullYear();
                    if (year >= currentYear - 2) {
                        allTransfers.push({
                            date: t.date,
                            type: t.type,
                            teams: t.teams,
                            player: player
                        });
                    }
                }
            });
        });

        // Sort by date descending
        allTransfers.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 4. Save to Cache
        await TransferCache.findOneAndUpdate(
            { teamId: teamIdNum },
            {
                teamId: teamIdNum,
                lastUpdated: new Date(),
                transfers: allTransfers
            },
            { upsert: true, new: true }
        );

        return allTransfers;

    } catch (error) {
        console.error(`❌ Error in getTeamTransfers: ${error.message}`);
        return [];
    }
};
