import { notFound } from "next/navigation";
import { cache } from "react";
import FixtureDetailsClient from "./FixtureDetailsClient";

/** Avoid hammering Render; still fresh enough for match pages */
export const revalidate = 30;

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

// --------------------------------------------------------------------------
// Do NOT pre-render prediction URLs at build time.
// Pre-building 50× pages each calling Render twice (page + metadata) caused
// 5+ minute builds and 300s timeouts when Render was slow or resetting (ECONNRESET).
// All /prediction/[id] pages are generated on-demand with a hard fetch timeout.
// --------------------------------------------------------------------------
export async function generateStaticParams() {
    return [];
}

function fetchWithTimeout(url: string, revalidateSeconds: number): Promise<Response> {
    return fetch(url, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        next: { revalidate: revalidateSeconds },
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
        const res = await fetchWithTimeout(url, 30);

        if (!res.ok) {
            console.error(`⚠️ Failed to fetch details for ${id}. Status: ${res.status}`);
            return null;
        }

        const json = await res.json();
        return json.data as FixtureDetailData;
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`⚠️ Fetch failed for fixture ${id}:`, msg);
        return null;
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
