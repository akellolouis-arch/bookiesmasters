
import React from "react";

interface LeagueHeaderProps {
    league: string;
    logo?: string;
    country?: string;
}
const LeagueHeader: React.FC<LeagueHeaderProps> = ({ league, logo, country }) => {
    return (
        <div className="flex items-start justify-start gap-2 py-1 px-1">
            {logo && (
                <img
                    src={logo}
                    alt={league}
                    className="w-6 h-6 object-contain opacity-70"
                />
            )}
            <div className="flex flex-col items-start leading-none gap-0.5">
                <span className="text-sm font-bold text-gray-800 tracking-widest">
                    {league}
                </span>
                {country && (
                    <span className="text-[10px] font-medium text-gray-500">
                        {country}
                    </span>
                )}
            </div>
        </div>
    );
};

export default LeagueHeader;
