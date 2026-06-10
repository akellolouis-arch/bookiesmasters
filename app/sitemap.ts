import { MetadataRoute } from 'next';
import dbConnect from '@/lib/mongoose';
import Fixture from '@/backend/models/Fixture';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://bookiesmasters.com';

    // 1. Static Routes
    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 1,
        },
        {
            url: `${baseUrl}/predictions`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/fixtures`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
    ];

    // 2. Dynamic Dates (next 7 days)
    const dates = [];
    const now = new Date();
    for (let i = 0; i <= 7; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() + i);
        dates.push(d.toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" }));
    }

    const dateRoutes: MetadataRoute.Sitemap = dates.flatMap((date) => [
        {
            url: `${baseUrl}/predictions/${date}`,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/fixtures/${date}`,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.7,
        }
    ]);

    // 3. specific Matches (Fetch from DB)
    let matchRoutes: MetadataRoute.Sitemap = [];
    try {
        await dbConnect();

        // Fetch active matches for next 2 days to keep sitemap manageable but relevant
        // (Google crawls frequent pages, we don't need 3000 matches in sitemap, just the important upcoming ones)
        const future = new Date();
        future.setDate(future.getDate() + 3); // next 3 days
        const past = new Date();
        past.setHours(past.getHours() - 24); // Keep recent results for 24h

        const fixtures = await Fixture.find({
            "fixture.date": { $gte: past.toISOString(), $lte: future.toISOString() }
        })
            .select("fixtureId updatedAt")
            .limit(2000) // Safety limit
            .lean();

        matchRoutes = fixtures.map((f: any) => ({
            url: `${baseUrl}/prediction/${f.fixtureId}`,
            lastModified: f.updatedAt || new Date(),
            changeFrequency: 'hourly',
            priority: 0.7,
        }));

    } catch (error) {
        console.error("Sitemap generation error:", error);
    }

    return [...staticRoutes, ...dateRoutes, ...matchRoutes];
}
