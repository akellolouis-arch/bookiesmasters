import FixturesList from "@/components/fixtures/FixturesList";
import { getLiveFixturesGroupedByLeague } from "@/backend/services/fixtureCardService";
import dbConnect from "@/lib/mongoose";
import { Suspense } from "react";

export const revalidate = 15; // Cache live fixtures for 15s at Edge to absorb concurrent traffic

export async function generateMetadata() {
  return {
    title: "Live Football Fixtures | BookiesMasters",
    description: "All live football fixtures and livescores on BookiesMasters.",
  };
}

export default async function LiveFixturesPage() {
  let initialData: any[] = [];

  try {
    await dbConnect();
    const rawFixtures = await getLiveFixturesGroupedByLeague({ allFixtures: true });

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
    console.error("❌ Error fetching live fixtures in Server Component:", error);
  }

  return (
    <Suspense fallback={null}>
      <FixturesList initialData={initialData} initialDate="live" />
    </Suspense>
  );
}
