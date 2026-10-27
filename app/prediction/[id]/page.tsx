import { notFound } from "next/navigation";
import { cache } from "react";
import FixtureDetailsClient from "./FixtureDetailsClient";
import { getFixtureById } from "@/backend/services/fixtureService";
import dbConnect from "@/lib/mongoose";

export const revalidate = 60; // ISR: cache match pages for 60 seconds at Edge

const FETCH_TIMEOUT_MS = 25_000;

interface FixtureDetailData {
    fixtureId: number;
    leagueId: number;
    league: string;
    leagueLogo: string;
    country: string;
    date: string;
    displayDate: string;
    status: string;
    venue: string;
    tip: string;
    homeTeam: any;
    awayTeam: any;
    h2h: any[];
    events?: any[];
    statistics?: any[];
    lineups?: any[];
    injuries?: any[];
    standings?: any[];
}

function fetchWithTimeout(url: string): Promise<Response> {
    return fetch(url, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        next: { revalidate: 60 },
    });
}

const getFixture = cache(async (id: string): Promise<FixtureDetailData | null> => {
    // 1. Try fetching via API URL if set
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (base) {
        try {
            const url = `${base}/api/fixtures/${id}`;
            const res = await fetchWithTimeout(url);

            if (res.ok) {
                const json = await res.json();
                if (json?.data) return json.data as FixtureDetailData;
            } else if (res.status === 404) {
                return null;
            }
        } catch (e) {
            console.warn(`[FixturePage] API fetch failed for ${id}, falling back to DB:`, e);
        }
    }

    // 2. Direct database connection fallback (SSR & Local)
    try {
        await dbConnect();
        const dbData = await getFixtureById(id);
        if (dbData) {
            return dbData as unknown as FixtureDetailData;
        }
    } catch (dbErr) {
        console.error(`[FixturePage] DB fallback query failed for fixture ${id}:`, dbErr);
    }

    return null;
});

export default async function FixtureDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const data = await getFixture(id);

    if (!data) {
        notFound();
    }

    // JSON-LD Structured Data for Google (SportsEvent)
    const home = data.homeTeam?.name || "Home";
    const away = data.awayTeam?.name || "Away";
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        "name": `${home} vs ${away}`,
        "startDate": data.date,
        "location": {
            "@type": "Place",
            "name": data.venue || "Stadium"
        },
        "homeTeam": {
            "@type": "SportsTeam",
            "name": home,
            "logo": data.homeTeam?.logo
        },
        "awayTeam": {
            "@type": "SportsTeam",
            "name": away,
            "logo": data.awayTeam?.logo
        },
        "description": `Prediction for ${home} vs ${away} in ${data.league || "League"}. Tip: ${data.tip || "Check analysis"}`
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <FixtureDetailsClient data={data} />
        </>
    );
}

// --------------------------------------------------------------------------
// GENERATE METADATA (SEO Title & Description)
// --------------------------------------------------------------------------
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = await getFixture(id);

    if (!data) {
        return {
            title: "Fixture Not Found | BookiesMasters",
        };
    }

    const home = data.homeTeam?.name || "Home";
    const away = data.awayTeam?.name || "Away";
    const title = `${home} vs ${away} Prediction | BookiesMasters`;
    const description = `Football betting tips for ${home} vs ${away} (${data.league || "League"}). Free analysis, H2H stats, and predictions.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [
                {
                    url: "https://bookiesmasters.com/match_poster.png", // Fallback, could be dynamic
                    width: 1200,
                    height: 630,
                    alt: `${home} vs ${away}`,
                },
            ],
        },
    };
}
