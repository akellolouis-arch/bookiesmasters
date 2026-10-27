import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface LeagueHeaderProps {
    league: string;
    logo?: string;
    country?: string;
    leagueId?: number;
}

const LeagueHeader: React.FC<LeagueHeaderProps> = ({ league, logo, country, leagueId }) => {
    const content = (
        <div className="flex items-center justify-between gap-2 py-1.5 px-2 bg-gray-100 hover:bg-gray-200/80 transition-colors rounded-none shadow-xs group cursor-pointer w-full">
            <div className="flex items-center gap-2 min-w-0">
                {logo && (
                    <img
                        src={logo}
                        alt={league}
                        className="w-5 h-5 object-contain flex-shrink-0"
                    />
                )}
                <div className="flex flex-col items-start leading-tight min-w-0">
                    <span className="text-xs font-bold text-gray-800 tracking-wide group-hover:text-teal-700 transition-colors truncate">
                        {league}
                    </span>
                    {country && (
                        <span className="text-[10px] font-medium text-gray-500 capitalize truncate">
                            {country.toLowerCase()}
                        </span>
                    )}
                </div>
            </div>
            {leagueId && (
                <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 group-hover:text-teal-700 transition-colors flex-shrink-0">
                    <span className="hidden sm:inline">League Table & Stats</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                </div>
            )}
        </div>
    );

    if (leagueId) {
        return (
            <Link href={`/league/${leagueId}`} className="block w-full">
                {content}
            </Link>
        );
    }

    return content;
};

export default LeagueHeader;
