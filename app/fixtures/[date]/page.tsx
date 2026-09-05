import PredictionsList from "@/app/predictions/[date]/predictionList";
import DateNavigator from "@/components/DateNavigator";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

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
    title: `All Fixtures for ${readableDate} | BookiesMasters`,
    description: `Get all football fixtures, odds, and livescores for matches on ${readableDate}.`,
  };
}

// ---------------------
// PAGE COMPONENT
// ---------------------
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

  let backendData: BackendResponse | null = null;
  let initialData: LeagueGroup[] = [];

  try {
    // Fetch all fixtures
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/predictions/cards?date=${date}`,
      { cache: 'no-store' }
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
    <PredictionsList initialData={initialData} initialDate={date} />
  );
}
