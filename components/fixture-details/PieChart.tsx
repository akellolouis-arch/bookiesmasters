import React from 'react';

interface PieChartProps {
    val1: number;
    color1: string;
    val2: number;
    color2: string;
}

const PieChart: React.FC<PieChartProps> = ({ val1, color1, val2, color2 }) => {
    const r = 15.91549430918954;
    const center = 21;
    const strokeWidth = 31.83; 

    const total = val1 + val2;
    const p1 = total === 0 ? 0 : (val1 / total) * 100;
    const p2 = total === 0 ? 0 : (val2 / total) * 100;

    const labelRadius = 10; // distance from center for the labels

    const getCoordinatesForPercent = (percent: number) => {
        const angleInDegrees = (percent * 3.6);
        const angleInRadians = (angleInDegrees - 90) * (Math.PI / 180);
        return {
            x: center + Math.cos(angleInRadians) * labelRadius,
            y: center + Math.sin(angleInRadians) * labelRadius,
        };
    };

    const mid1 = p1 / 2;
    const mid2 = p1 + (p2 / 2);

    const pos1 = getCoordinatesForPercent(mid1);
    const pos2 = getCoordinatesForPercent(mid2);

    return (
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 filter drop-shadow-md">
            {/* The actual Pie Chart SVG */}
            <svg viewBox="0 0 42 42" className="w-full h-full rounded-full border border-white/5" style={{ transform: 'rotate(-90deg)' }}>
                {p1 > 0 && (
                    <circle 
                        cx={center} 
                        cy={center} 
                        r={r} 
                        fill="transparent" 
                        stroke={color1} 
                        strokeWidth={strokeWidth} 
                        strokeDasharray={`${p1} ${100 - p1}`} 
                        strokeDashoffset="0"
                        className="transition-all duration-500 ease-out"
                    />
                )}
                {p2 > 0 && (
                    <circle 
                        cx={center} 
                        cy={center} 
                        r={r} 
                        fill="transparent" 
                        stroke={color2} 
                        strokeWidth={strokeWidth} 
                        strokeDasharray={`${p2} ${100 - p2}`} 
                        strokeDashoffset={`-${p1}`} 
                        className="transition-all duration-500 ease-out"
                    />
                )}
            </svg>
            
            {/* The Labels SVG Overlay (not rotated so text stays upright) */}
            <svg viewBox="0 0 42 42" className="absolute top-0 left-0 w-full h-full pointer-events-none">
                {p1 > 0 && p1 < 100 && (
                    <text x={pos1.x} y={pos1.y} fill="white" fontSize="4.5" fontWeight="bold" textAnchor="middle" dominantBaseline="central" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.8)' }}>
                        {Math.round(p1)}%
                    </text>
                )}
                {p2 > 0 && p2 < 100 && (
                    <text x={pos2.x} y={pos2.y} fill="white" fontSize="4.5" fontWeight="bold" textAnchor="middle" dominantBaseline="central" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.8)' }}>
                        {Math.round(p2)}%
                    </text>
                )}
                {p1 === 100 && (
                    <text x={center} y={center} fill="white" fontSize="6" fontWeight="bold" textAnchor="middle" dominantBaseline="central" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.8)' }}>
                        100%
                    </text>
                )}
                {p2 === 100 && (
                    <text x={center} y={center} fill="white" fontSize="6" fontWeight="bold" textAnchor="middle" dominantBaseline="central" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.8)' }}>
                        100%
                    </text>
                )}
            </svg>
        </div>
    );
};

export default PieChart;
