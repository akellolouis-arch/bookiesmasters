import FixturesList from "@/components/fixtures/FixturesList";

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

  let backendData: any = null;
  let initialData: any[] = [];

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/fixtures/cards?date=${date}`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      console.error(`❌ Backend returned status ${res.status} for date ${date}`);
    } else {
      backendData = await res.json();
    }
  } catch (error) {
    console.error("❌ Error fetching fixtures in Server Component:", error);
  }

  if (backendData && backendData.fixtures) {
    initialData = backendData.fixtures
      .map((f: any) => ({
        id: f.league.id,
        name: f.league.name,
        logo: f.league.logo,
        country: f.league.country,
        matches: f.matches,
      }))
      .filter((league: any) => league.matches.length > 0);
  }

  return (
    <FixturesList initialData={initialData} initialDate={date} />
  );
}
