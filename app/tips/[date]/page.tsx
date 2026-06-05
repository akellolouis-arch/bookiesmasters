import PredictionsList from "@/app/predictions/[date]/predictionList";
import DateNavigator from "@/components/DateNavigator";

export const revalidate = 86400; // Cache for 1 day (ISR)
export const dynamicParams = true; // Allow generating pages for new dates

// ---------------------
// Backend Types
// ---------------------
interface BackendLeague {
  id: number;
  name: string;
  logo: string;
  country: string;
}

interface BackendMatch {
  fixtureId: number;
  status: string;
  score: string | null;
  homeTeam: {
    id: number;
    name: string;
    logo: string;
  };
  awayTeam: {
    id: number;
    name: string;
    logo: string;
  };
  odds: {
    home: string | null;
    draw: string | null;
    away: string | null;
  };
  league: BackendLeague;
}

interface BackendFixture {
  league: BackendLeague;
  matches: BackendMatch[];
}

interface BackendResponse {
  date: string;
  totalLeagues: number;
  fixtures: BackendFixture[];
}

// Type expected by the component
export interface LeagueGroup {
  id: number;
  name: string;
  logo: string;
  country: string;
  matches: BackendMatch[];
}

// ---------------------
// STATIC PARAMS GENERATION (SSG/ISR)
// ---------------------
export async function generateStaticParams() {
  const dates = [];
  const now = new Date();

  // Pre-build: Yesterday, Today, Tomorrow
  for (let i = -1; i <= 1; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    dates.push(d.toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" }));
  }

  return dates.map((date) => ({
    date: date,
  }));
}

// ---------------------
// DYNAMIC METADATA
// ---------------------
export async function generateMetadata({ params }: { params: Promise<{ date?: string }> }) {
  const resolvedParams = await params;
  const date = resolvedParams.date || new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });

  const d = new Date(date);
  const isValidDate = !isNaN(d.getTime());
  const readableDate = isValidDate
    ? d.toLocaleDateString("en-US", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : date;

  return {
    title: `Expert Predictions for ${readableDate} | BookiesMasters`,
    description: `Get our filtered expert predictions and tips for matches on ${readableDate}.`,
  };
}

// ---------------------
// PAGE COMPONENT
// ---------------------
export default async function TipsPage({
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

  let backendData: BackendResponse | null = null;
  let initialData: LeagueGroup[] = [];

  try {
    // ⭐️ Use the new predictions endpoint instead of fixtures
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/predictions/cards?date=${date}`,
      { next: { revalidate: 86400 } }
    );

    if (!res.ok) {
      console.error(`❌ Backend returned status ${res.status} for date ${date}`);
    } else {
      backendData = await res.json();
    }

  } catch (error) {
    console.error("❌ Error fetching predictions in Server Component:", error);
  }

  if (backendData && backendData.fixtures) {
    initialData = backendData.fixtures
      .map((f) => ({
        id: f.league.id,
        name: f.league.name,
        logo: f.league.logo,
        country: f.league.country,
        matches: f.matches,
      }))
      .filter((league) => league.matches.length > 0);
  }

  return (
    <>
      <DateNavigator date={date} />
      {initialData.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 mt-10">
          <p className="text-gray-400 text-lg font-medium">No strict predictions found for this date.</p>
          <p className="text-gray-500 text-sm mt-2 max-w-md text-center">Our algorithm only predicts when the data is exceptionally strong. Check back tomorrow!</p>
        </div>
      ) : (
        <PredictionsList initialData={initialData} date={date} />
      )}
    </>
  );
}
