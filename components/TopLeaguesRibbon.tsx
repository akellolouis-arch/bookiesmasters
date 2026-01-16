"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Hardcoded Top Leagues (Same as LeagueExplorer to maintain consistency)
const TOP_LEAGUES = [
    { id: 39, name: "Premier League", logo: "https://media.api-sports.io/football/leagues/39.png" },
    { id: 140, name: "La Liga", logo: "https://media.api-sports.io/football/leagues/140.png" },
    { id: 78, name: "Bundesliga", logo: "https://media.api-sports.io/football/leagues/78.png" },
    { id: 135, name: "Serie A", logo: "https://media.api-sports.io/football/leagues/135.png" },
    { id: 61, name: "Ligue 1", logo: "https://media.api-sports.io/football/leagues/61.png" },
    { id: 2, name: "Champions League", logo: "https://media.api-sports.io/football/leagues/2.png" },
    { id: 3, name: "Europa League", logo: "https://media.api-sports.io/football/leagues/3.png" },
    // { id: 848, name: "Conference League", logo: "https://media.api-sports.io/football/leagues/848.png" },
];

export default function TopLeaguesRibbon() {
    const pathname = usePathname();

    return (
        <div className="w-full bg-[#181818] border-b border-white/5 py-2">
            <div className="max-w-7xl mx-auto px-2 md:px-8">
                <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide no-scrollbar">
                    {TOP_LEAGUES.map((league) => {
                        const isActive = pathname === `/league/${league.id}`;
                        return (
                            <Link
                                key={league.id}
                                href={`/league/${league.id}`}
                                className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full transition-all whitespace-nowrap border ${isActive
                                    ? "bg-[#63FF79]/10 border-[#63FF79]/50 text-[#63FF79]"
                                    : "bg-[#252525] border-transparent text-gray-400 hover:bg-[#333] hover:text-gray-200"
                                    }`}
                            >
                                <img
                                    src={league.logo}
                                    alt={league.name}
                                    className="w-4 h-4 object-contain"
                                />
                                <span className="text-[11px] font-medium uppercase tracking-wide">
                                    {league.name}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Hide scrollbar utility within the component if not global */}
            <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
        </div>
    );
}
