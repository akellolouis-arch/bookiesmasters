import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import LeagueDetailsClient, { LeagueDetailsData } from "./LeagueDetailsClient";
import { getLeagueDetails } from "@/backend/services/leagueService";
import dbConnect from "@/lib/mongoose";

export const revalidate = 120; // Revalidate every 2 minutes

const FETCH_TIMEOUT_MS = 15_000;

function fetchWithTimeout(url: string): Promise<Response> {
    return fetch(url, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        next: { revalidate: 120 },
    });
}

const getLeague = cache(async (id: string): Promise<LeagueDetailsData | null> => {
    // 1. Try fetching via API URL if set
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (base) {
        try {
            const url = `${base}/api/leagues/${id}`;
            const res = await fetchWithTimeout(url);
            if (res.ok) {
                const json = await res.json();
                if (json.data) return json.data as LeagueDetailsData;
            }
        } catch (e) {
            console.warn(`[LeaguePage] API fetch failed for ${id}, falling back to DB:`, e);
        }
    }

    // 2. Direct database connection fallback (SSR & Local)
    try {
        await dbConnect();
        const data = await getLeagueDetails(id);
        return data as LeagueDetailsData | null;
    } catch (dbErr) {
        console.error(`[LeaguePage] DB query failed for league ${id}:`, dbErr);
        return null;
    }
});

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    const data = await getLeague(id);

    if (!data || !data.league) {
        return {
            title: "League Details | BookiesMasters",
            description: "View league tables, fixtures, and top scorers on BookiesMasters.",
        };
    }

    return {
        title: `${data.league.name} - Standings, Fixtures & Top Scorers | BookiesMasters`,
        description: `Check the latest league table, upcoming fixtures, recent results, and top goal scorers for ${data.league.name} (${data.league.country}).`,
        openGraph: {
            title: `${data.league.name} - Standings & Fixtures`,
            description: `Football standings and statistics for ${data.league.name}.`,
            images: data.league.logo ? [data.league.logo] : [],
        },
    };
}

export default async function LeaguePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const data = await getLeague(id);

    if (!data) {
        notFound();
    }

    return <LeagueDetailsClient data={data} />;
}
