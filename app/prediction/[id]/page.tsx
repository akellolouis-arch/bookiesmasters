import { notFound } from "next/navigation";
import { cache } from "react";
import FixtureDetailsClient from "./FixtureDetailsClient";

export const dynamic = 'force-dynamic';

/** Fail fast so Vercel never sits 300s on a stuck upstream (504 in your logs) */
const FETCH_TIMEOUT_MS = 15_000;

interface FixtureDetailData {
    fixtureId: number;
    leagueId: number;
    league: string;
    leagueLogo: string;
    date: string;
    displayDate: string;
    status: string;
    venue: string;
    tip: string;
    homeTeam: any;
    awayTeam: any;
    h2h: any[];
}


function fetchWithTimeout(url: string): Promise<Response> {
    return fetch(url, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        cache: 'no-store',
    });
}

const getFixture = cache(async (id: string): Promise<FixtureDetailData | null> => {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) {
        console.error("NEXT_PUBLIC_API_URL is not set");
        return null;
    }

    const url = `${base}/api/fixtures/${id}`;

    try {
        const res = await fetchWithTimeout(url);

        if (!res.ok) {
            console.error(`⚠️ Failed to fetch details for ${id}. Status: ${res.status}`);
            // Only return null for an actual 404 (fixture doesn't exist).
            // For 500s, 502s, 504s, throw an error to prevent Next.js from caching a 404 page.
            if (res.status === 404) return null;
            throw new Error(`API returned ${res.status}`);
        }

        const json = await res.json();
        return json.data as FixtureDetailData;
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`⚠️ Fetch failed for fixture ${id}:`, msg);
        // Throw the error so Next.js does NOT cache a 404 page.
        // It will trigger error.tsx (or a 500) and try again on next request.
        throw new Error(`Fetch failed: ${msg}`);
    }
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
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        "name": `${data.homeTeam.name} vs ${data.awayTeam.name}`,
        "startDate": data.date,
        "location": {
            "@type": "Place",
            "name": data.venue || "Stadium"
        },
        "homeTeam": {
            "@type": "SportsTeam",
            "name": data.homeTeam.name,
            "logo": data.homeTeam.logo
        },
        "awayTeam": {
            "@type": "SportsTeam",
            "name": data.awayTeam.name,
            "logo": data.awayTeam.logo
        },
        "description": `Prediction for ${data.homeTeam.name} vs ${data.awayTeam.name} in ${data.league}. Tip: ${data.tip || "Check analysis"}`
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

    const title = `${data.homeTeam.name} vs ${data.awayTeam.name} Prediction | BookiesMasters`;
    const description = `Football betting tips for ${data.homeTeam.name} vs ${data.awayTeam.name} (${data.league}). Free analysis, H2H stats, and predictions.`;

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
                    alt: `${data.homeTeam.name} vs ${data.awayTeam.name}`,
                },
            ],
        },
    };
}
