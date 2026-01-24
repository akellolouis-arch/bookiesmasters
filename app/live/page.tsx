import PredictionsList from "@/app/predictions/[date]/predictionList";
import DateNavigator from "@/components/DateNavigator";
import LeagueExplorer from "@/components/home/LeagueExplorer";


// Force dynamic rendering (SSR)
export const dynamic = "force-dynamic";

export default async function LivePage() {

    // Create a Date object for Today's Date Navigator context
    const today = new Date().toLocaleDateString("en-CA", {
        timeZone: "Africa/Nairobi",
    });

    // Initial Data Fetch (Server Side)
    // We fetch from the live endpoint
    let initialData = [];

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fixtures/live`, {
            cache: "no-store"
        });

        if (res.ok) {
            const json = await res.json();
            const backendFixtures = json.fixtures;

            // Transform for component if needed (Backend returns grouped by league, which matches component expectation roughly)
            // PredictionList expects Flattened object if using the same transform logic, 
            // OR the exact shape from backend. 
            // Let's rely on PredictionList's internal "safeData" transform logic which handles both nesting styles we added earlier.

            initialData = backendFixtures.map((f: any) => ({
                id: f.league.id,
                name: f.league.name,
                logo: f.league.logo,
                country: f.league.country,
                matches: f.matches,
            }));
        }
    } catch (err) {
        console.error("❌ Error fetching live fixtures server-side:", err);
    }

    return (
        <>
            {/* Date Navigator (Passing today's date so user can navigate OUT of live view comfortably) */}
            <DateNavigator date={today} />

            <div className="max-w-xl mx-auto mt-4 mb-2 px-2">
                <PredictionsList initialData={initialData} date="live" />
            </div>


            <div className="mt-1 mb-12">
                <LeagueExplorer />
            </div>
        </>
    );
}
