import React from 'react';

// Define the interface for a Trend object
interface Trend {
    text: string;
    type: 'positive' | 'negative' | 'neutral';
    icon: string;
}

interface MatchTrendsProps {
    trends: Trend[];
}

export default function MatchTrends({ trends }: MatchTrendsProps) {
    if (!trends || trends.length === 0) return null;

    return (
        <div className="bg-zinc-900/50 rounded-xl overflow-hidden mb-4 border border-zinc-800">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-900/40 to-zinc-900 px-4 py-2 border-b border-zinc-800 flex items-center gap-2">
                <span className="text-sm font-bold text-teal-400 uppercase tracking-widest">
                    Match Insights
                </span>
                <div className="flex-1 h-px bg-zinc-800"></div>
                <div className="text-xs text-xs px-2 py-0.5 rounded bg-zinc-800 text-gray-600">
                    AI generated
                </div>
            </div>

            {/* List */}
            <div className="p-4 grid gap-3">
                {trends.map((trend, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                        <div className={`p-2 rounded-full shrink-0 ${trend.type === 'positive' ? 'bg-green-500/10 text-green-400' :
                                trend.type === 'negative' ? 'bg-red-500/10 text-red-400' :
                                    'bg-teal-500/10 text-teal-700'
                            }`}>
                            <span className="text-lg leading-none">{trend.icon}</span>
                        </div>
                        <div className="py-1">
                            <p className="text-sm font-medium text-gray-800 leading-snug">
                                {trend.text}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
