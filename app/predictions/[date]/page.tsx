import PredictionsList from "./predictionList";
import DateNavigator from "@/components/DateNavigator";
import { Suspense } from "react";


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
    title: `Expert Predictions for ${readableDate} | BookiesMasters`,
    description: `Get our filtered expert predictions and tips for matches on ${readableDate}.`,
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
      `${process.env.NEXT_PUBLIC_API_URL}/api/predictions/cards?date=${date}`,
      { next: { revalidate: 86400 } } // Cache at the Data Cache level for 1 day
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
      <Suspense fallback={<div className="h-10 w-full bg-[#1F1F1F] animate-pulse border-y border-white/5" />}>
        <DateNavigator date={date} />
      </Suspense>

      <Suspense fallback={<div className="p-4 text-center text-gray-500 animate-pulse">Loading list...</div>}>
        <PredictionsList initialData={initialData} date={date} />
      </Suspense>
    </>
  );
}
