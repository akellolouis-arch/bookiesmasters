import PredictionsList from "../predictions/[date]/predictionList";
import DateNavigator from "@/components/DateNavigator";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

interface BackendLeague {
  id: number;
  name: string;
  logo: string;
  country: string;
}

interface BackendMatch {
  fixtureId: number;
  status: string;
  kickoffTime?: string;
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
  prediction?: string | null;
}

interface BackendFixture {
  league: BackendLeague;
  matches: BackendMatch[];
}

interface BackendResponse {
  totalLeagues: number;
  fixtures: BackendFixture[];
}

export async function generateMetadata() {
  return {
    title: "Live Football Predictions | BookiesMasters",
    description: "Live football fixtures, scores, and tips on BookiesMasters.",
  };
}

export default async function LivePage() {
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Nairobi",
  });

  let backendData: BackendResponse | null = null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fixtures/live`, {
      next: { revalidate: 86400 },
    });
    if (res.ok) {
      backendData = await res.json();
    } else {
      console.error(`❌ Backend returned status ${res.status} for live fixtures`);
    }
  } catch (error) {
    console.error("❌ Error fetching live fixtures:", error);
  }

  const initialData = backendData?.fixtures
    ? backendData.fixtures.map((f) => ({
        id: f.league.id,
        name: f.league.name,
        logo: f.league.logo,
        country: f.league.country,
        matches: f.matches ?? [],
      }))
    : [];

  return (
    <>
      <Suspense fallback={null}>
        <DateNavigator date={today} />
      </Suspense>
      <Suspense fallback={null}>
        <PredictionsList initialData={initialData} date="live" />
      </Suspense>
    </>
  );
}

