import PredictionsList from "./predictionList";
import TopTrends from "@/components/home/TopTrends";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

export interface LeagueGroup {
  id: number;
  name: string;
  logo: string;
  country: string;
  matches: any[];
}

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

export default async function PredictionsPage({
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

  let initialData: LeagueGroup[] = [];

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/predictions/cards?date=${date}`,
      { cache: 'no-store' }
    );

    if (res.ok) {
      const backendData = await res.json();
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
    }
  } catch (error) {
    console.error("❌ Error fetching fixtures in Server Component:", error);
  }

  return (
    <PredictionsList initialData={initialData} initialDate={date}>
      <Suspense fallback={<div className="h-20 w-full" />}>
        <TopTrends />
      </Suspense>
    </PredictionsList>
  );
}
