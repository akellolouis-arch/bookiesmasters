import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://bookiesmasters.com';

    // Dynamic dates: yesterday, today, tomorrow
    const dates = [];
    const now = new Date();
    for (let i = -1; i <= 7; i++) { // Generate for a whole week ahead
        const d = new Date(now);
        d.setDate(d.getDate() + i);
        dates.push(d.toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" }));
    }

    const predictionUrls = dates.map((date) => ({
        url: `${baseUrl}/predictions/${date}`,
        lastModified: new Date(),
        changeFrequency: 'hourly' as const,
        priority: 0.8,
    }));

    return [
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
        ...predictionUrls,
    ];
}
