import React from 'react';
import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, Sun, MapPin, Cloudy } from 'lucide-react';

interface MatchConditionsProps {
    conditions: {
        weather?: {
            temp: number;
            precip: number;
            code: number;
        };
        distance?: number; // km
        venueCity?: string;
    };
}

const getWeatherIcon = (code: number) => {
    // WMO Weather interpretation codes (WW)
    if (code <= 1) return <Sun className="w-5 h-5 text-yellow-400" />;
    if (code <= 3) return <Cloudy className="w-5 h-5 text-gray-400" />;
    if ([45, 48].includes(code)) return <CloudFog className="w-5 h-5 text-gray-400" />;
    if ([51, 53, 55, 56, 57].includes(code)) return <CloudRain className="w-5 h-5 text-blue-300" />;
    if ([61, 63, 65, 80, 81, 82].includes(code)) return <CloudRain className="w-5 h-5 text-blue-500" />;
    if ([71, 73, 75, 77, 85, 86].includes(code)) return <CloudSnow className="w-5 h-5 text-white" />;
    if ([95, 96, 99].includes(code)) return <CloudLightning className="w-5 h-5 text-yellow-300" />;
    return <Cloud className="w-5 h-5 text-gray-400" />; // Fallback
};

const getWeatherDescription = (code: number) => {
    if (code <= 1) return "Clear";
    if (code <= 3) return "Cloudy";
    if ([45, 48].includes(code)) return "Foggy";
    if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
    if ([61, 63, 65, 80, 81, 82].includes(code)) return "Rain";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
    if ([95, 96, 99].includes(code)) return "Storm";
    return "Unknown";
};

const MatchConditions: React.FC<MatchConditionsProps> = ({ conditions }) => {
    if (!conditions || (!conditions.weather && !conditions.distance)) return null;

    const { weather, distance } = conditions;

    return (
        <div className="flex justify-center -mt-2 mb-4 animate-in fade-in slide-in-from-top-2">
            <div className="bg-[#1e1e1e]/80 border border-white/5 backdrop-blur-md rounded-xl p-3 flex items-center justify-center space-x-6 shadow-lg min-w-[200px]">

                {/* Weather Section */}
                {weather && (
                    <div className={`flex items-center space-x-3 ${distance ? 'pr-6 border-r border-white/10' : ''}`}>
                        <div className="bg-white/5 p-2.5 rounded-full">
                            {getWeatherIcon(weather.code)}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Conditions</span>
                            <div className="flex items-center space-x-1.5">
                                <span className="text-sm font-bold text-white">{weather.temp}°C</span>
                                <span className="text-xs text-gray-400 font-medium">{getWeatherDescription(weather.code)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Distance Section */}
                {distance ? (
                    <div className="flex items-center space-x-3">
                        <div className="bg-white/5 p-2.5 rounded-full">
                            <MapPin className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Away Travel</span>
                            <div className="flex items-center space-x-1">
                                <span className="text-sm font-bold text-white">{distance.toLocaleString()} km</span>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default MatchConditions;
