
import React from 'react';

interface PredictionDisplayProps {
    advice: string | null;
    tip: string | null;
    winner?: { name?: string | null, comment?: string | null } | null;
}

const PredictionDisplay: React.FC<PredictionDisplayProps> = ({ advice, tip, winner }) => {
    if (!advice && !tip) return null;

    return (
        <div className="bg-[#1e1e1e] border border-green-500/30 rounded-lg p-4 mb-4 animate-in fade-in">

            {/* HEADER: MAIN TIP */}
            <div className="flex justify-between items-start mb-0">
                <div>
                    <div className="text-xs text-gray-600 uppercase tracking-widest mb-1">Our Tip</div>
                    <div className="text-2xl font-bold text-green-400">{tip}</div>
                    {winner?.comment && <div className="text-xs text-gray-500 mt-1">"{winner.comment}"</div>}
                </div>
                {advice && (
                    <div className="text-right max-w-[60%]">
                        <div className="text-xs text-gray-600 uppercase tracking-widest mb-1">Advice</div>
                        <div className="text-sm text-gray-800 font-medium">"{advice}"</div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default PredictionDisplay;
