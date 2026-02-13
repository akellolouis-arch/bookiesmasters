import { notFound } from "next/navigation";
import FixtureDetailsClient from "./FixtureDetailsClient";

// Enable ISR with 1-second regeneration (matches Homepage speed)
export const revalidate = 1;

// Note: dynamicParams = true is default, so we don't need to force-dynamic

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
// GENERATE STATIC PARAMS (Pre-build today's active matches for instant load)
// --------------------------------------------------------------------------
export async function generateStaticParams() {
    try {
        // 1. Get Today's Date in Kenya Time
        const today = new Date().toLocaleDateString("en-CA", {
            timeZone: "Africa/Nairobi",
        });

        // 2. Fetch all fixture IDs for today from our own API
        // Note: During build, this hits the backend. Ensure backend is running or use a direct DB call if preferred.
        // For simplicity/safety in this setup, we try fetch. If it fails (backend not running), we return empty [].
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fixtures/cards?date=${today}`, {
            next: { revalidate: 60 }
        });

        if (!res.ok) return [];

        const json = await res.json();
        const fixtures = json.fixtures || [];

        // 3. Extract IDs. The API returns grouped by league, so we flatten matches.
        // Structure: [ { league:..., matches: [ { fixtureId: 100 }, ... ] }, ... ]
        const paths: { id: string }[] = [];

        fixtures.forEach((group: any) => {
            if (group.matches) {
                group.matches.forEach((m: any) => {
                    if (m.fixtureId) {
                        paths.push({ id: String(m.fixtureId) });
                    }
                });
            }
        });

        // Best Practice: Pre-build the top 50 matches (Instant).
        // The rest are built on-demand (Fast ~0.5s thanks to DB indexes).
        return paths.slice(0, 50);

    } catch (error) {
        console.error("⚠️ generateStaticParams failed (Backend likely down):", error);
        return [];
    }
}

async function getFixture(id: string) {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/fixtures/${id}`;
    console.log("🔍 Fetching URL:", url); // <--- DEBUG LOG
    const res = await fetch(url, {
        next: { revalidate: 1 }, // ISR: Cache for 1 second (Fast load + Fresh data)
    });

    if (!res.ok) {
        // If backend is down or errors during build, don't crash the whole build.
        // Just return null, which will trigger notFound() in the component.
        console.error(`⚠️ Failed to fetch details for ${id}. Status: ${res.status}`);
        return null;
    }

    const json = await res.json();
    return json.data as FixtureDetailData; // 'data' wrapper from controller
}

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
