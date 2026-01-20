import PredictionsList from "./predictionList";
import DateNavigator from "@/components/DateNavigator";
import LeagueExplorer from "@/components/home/LeagueExplorer";



export const dynamic = "force-dynamic"; // SSR: Always fetch fresh data on server

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

  // Returns array of params: [{ date: '2025-12-26' }, { date: '2025-12-27' }, ...]
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

  // Validate date string
  const d = new Date(date);
  const isValidDate = !isNaN(d.getTime());
  const readableDate = isValidDate
    ? d.toLocaleDateString("en-US", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : date;

  return {
    title: `Football Predictions for ${readableDate} | BookiesMasters`,
    description: `Get free betting tips, odds, and livescores for matches on ${readableDate}.`,
  };
}

// ---------------------
// PAGE COMPONENT
// ---------------------
export default async function PredictionsPage({
  params,
}: {
  params: Promise<{ date?: string }>;
}) {
  const resolvedParams = await params;
  let date = resolvedParams.date;

  // If no date is provided (e.g. homepage route) → ALWAYS use today's Kenya date
  if (!date) {
    date = new Date().toLocaleDateString("en-CA", {
      timeZone: "Africa/Nairobi",
    });
  }

  let backendData: BackendResponse | null = null;
  let initialData: LeagueGroup[] = [];

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/fixtures/cards?date=${date}`,
      { cache: "no-store" } // NEVER cache this request. Always fetch fresh from backend.
    );

    if (!res.ok) {
      console.error(`❌ Backend returned status ${res.status} for date ${date}`);
      // We do NOT want to crash the page, so we just return empty
    } else {
      backendData = await res.json();
    }

  } catch (error) {
    console.error("❌ Error fetching fixtures in Server Component:", error);
  }

  // If we successfully got data, map it. Otherwise initialData remains []
  if (backendData && backendData.fixtures) {
    initialData = backendData.fixtures.map((f) => ({
      id: f.league.id,
      name: f.league.name,
      logo: f.league.logo,
      country: f.league.country,
      matches: f.matches,
    }));
  }

  return (
    <>
      <DateNavigator date={date} />

      <PredictionsList initialData={initialData} date={date} />

      <div className="mt-1 mb-12">
        <LeagueExplorer />
      </div>
    </>
  );
}
