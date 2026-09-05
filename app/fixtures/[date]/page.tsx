import FixturesList from "@/components/fixtures/FixturesList";
import { getFixturesGroupedByLeague } from "@/backend/services/fixtureCardService";
import dbConnect from "@/lib/mongoose";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ date?: string }> }) {
  const resolvedParams = await params;
  const date = resolvedParams.date || new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });

  const d = new Date(date);
  const isValidDate = !isNaN(d.getTime());
  const readableDate = isValidDate
    ? d.toLocaleDateString("en-US", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : date;

  return {
    title: `All Fixtures for ${readableDate} | BookiesMasters`,
    description: `Get all football fixtures and livescores for matches on ${readableDate}.`,
  };
}

export default async function FixturesPage({
  params,
}: {
  params: Promise<{ date?: string }>;
}) {
  const resolvedParams = await params;
  let date = resolvedParams.date;

  if (!date) {
    date = new Date().toLocaleDateString("en-CA", {
      timeZone: "Africa/Nairobi",
    });
  }

  let initialData: any[] = [];

  try {
    await dbConnect();
    const rawFixtures = await getFixturesGroupedByLeague(date);

    if (rawFixtures && Array.isArray(rawFixtures)) {
      initialData = rawFixtures
        .map((f: any) => ({
          id: f.league.id,
          name: f.league.name,
          logo: f.league.logo,
          country: f.league.country,
          matches: f.matches,
        }))
        .filter((league: any) => league.matches.length > 0);
    }
  } catch (error) {
    console.error("❌ Error fetching fixtures in Server Component:", error);
  }

  return (
    <FixturesList initialData={initialData} initialDate={date} />
  );
}
