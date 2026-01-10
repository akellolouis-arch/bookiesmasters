"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, Sparkles, Gift } from "lucide-react";

// Matches backend PRIZES
const PRIZES = [
    { label: "40 CR", value: 40, color: "#9ca3af", text: "#000" }, // Was 10
    { label: "20 CR", value: 20, color: "#60a5fa", text: "#fff" },
    { label: "50 CR", value: 50, color: "#a855f7", text: "#fff" },
    { label: "100 CR", value: 100, color: "#eab308", text: "#000" },
    { label: "30 CR", value: 30, color: "#ef4444", text: "#fff" } // Was Jackpot (500)
];

interface SpinWheelProps {
    email: string;
    onWin: (amount: number) => void;
}

export default function SpinWheel({ email, onWin }: SpinWheelProps) {
    const [loading, setLoading] = useState(true);
    const [canSpin, setCanSpin] = useState(false);
    const [nextSpinTime, setNextSpinTime] = useState<Date | null>(null);
    const [spinning, setSpinning] = useState(false);
    const [lastWin, setLastWin] = useState<any>(null);
    const [rotation, setRotation] = useState(0);

    // Initial Check
    useEffect(() => {
        fetchStatus();
    }, [email]);

    // Timer
    const [timeLeft, setTimeLeft] = useState("");
    useEffect(() => {
        if (!nextSpinTime) return;
        const interval = setInterval(() => {
            const now = new Date();
            const diff = nextSpinTime.getTime() - now.getTime();
            if (diff <= 0) {
                setCanSpin(true);
                setNextSpinTime(null);
                setTimeLeft("");
            } else {
                const h = Math.floor(diff / (1000 * 60 * 60));
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${h}h ${m}m ${s}s`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [nextSpinTime]);

    const fetchStatus = async () => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const res = await fetch(`${baseUrl}/api/user/spin/status?email=${email}`);
            const data = await res.json();
            setCanSpin(data.canSpin);
            if (data.nextSpinTime) {
                setNextSpinTime(new Date(data.nextSpinTime));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSpin = async () => {
        if (!canSpin || spinning) return;

        setSpinning(true);
        setLastWin(null);

        // 1. Call API to get result first (Deterministic Spin)
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const res = await fetch(`${baseUrl}/api/user/spin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const data = await res.json();
            if (!data.success) {
                alert(data.error || "Spin failed");
                setSpinning(false);
                return;
            }

            // 2. Animate
            const wonPrize = data.prize; // e.g. { value: 20 }
            const prizeIndex = PRIZES.findIndex(p => p.value === wonPrize.value);

            // Calculate rotation to land on prize
            // Wheel has 5 segments. Each is 360/5 = 72 deg
            // Index 0 is at 0 degrees usually? Let's check typical CSS rotation.
            // If we rotate CLOCKWISE, visual moves COUNTER-CLOCKWISE relative to pointer at top.
            // Let's assume pointer is at TOP (0 deg).
            // Segment 0 matches 0deg?
            // To be safe, let's spin a bunch (e.g. 5 full rotations) + destination.

            const segmentAngle = 360 / PRIZES.length;
            // Target angle to LAND on the pointer (Top)
            // If pointer is Top, and we want Index 1 (72deg) to be at Top, we rotate -72 deg?
            // Actually let's just do random noise + formatted calculation

            // To maximize visual effect:
            // spin 5 * 360 + (360 - (prizeIndex * segmentAngle))
            // Adding a little random offset for realism within the segment center
            const randomOffset = Math.random() * (segmentAngle - 10) + 5;
            const targetRotation = 1800 + (360 - (prizeIndex * segmentAngle)) + rotation;

            setRotation(targetRotation);

            // Wait for animation (3s CSS transition)
            setTimeout(() => {
                setSpinning(false);
                setLastWin(wonPrize);
                setCanSpin(false);
                setNextSpinTime(new Date(data.nextSpinTime));
                onWin(wonPrize.value);
            }, 3000); // Must match CSS duration

        } catch (err) {
            console.error(err);
            setSpinning(false);
        }
    };

    if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin text-white mx-auto" /></div>;

    return (
        <div className="flex flex-col items-center justify-center py-8">
            <div className="relative mb-8">
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20">
                    <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[20px] border-t-white drop-shadow-lg"></div>
                </div>

                {/* Wheel Container */}
                <div
                    className="w-72 h-72 md:w-96 md:h-96 rounded-full border-4 border-white shadow-2xl overflow-hidden relative transition-transform duration-[3000ms] cubic-bezier(0.25, 1, 0.5, 1)"
                    style={{ transform: `rotate(${rotation}deg)` }}
                >
                    {PRIZES.map((prize, i) => {
                        const deg = (360 / PRIZES.length) * i;
                        return (
                            <div
                                key={i}
                                className="absolute w-full h-full text-center origin-bottom"
                                style={{
                                    backgroundColor: prize.color,
                                    transform: `rotate(${deg}deg) skewY(-${90 - (360 / PRIZES.length)}deg)`,
                                    // CSS Trick for pie slices often involves skew/clip-path, but simple conic gradient is easier.
                                    // Let's use a simpler Conic approach if possible, but DOM divs allow text rotation.
                                    // Actually, simplest is Conic Gradient background + Absolute Text.
                                    // But let's stick to this Absolute Div method.
                                    // With 5 items, slice is 72deg. skewY would be -18deg.
                                    // Wait, drawing perfect slices with divs is tricky.
                                    // Let's retry with CONIC GRADIENT background and absolute positioned labels.
                                    display: 'none' // Don't render this way
                                }}
                            >
                                {/* Text */}
                            </div>
                        );
                    })}

                    {/* Easier Render: Conic Gradient Background */}
                    <div className="w-full h-full absolute inset-0 rounded-full"
                        style={{
                            background: `conic-gradient(
                                ${PRIZES[0].color} 0deg 72deg,
                                ${PRIZES[1].color} 72deg 144deg,
                                ${PRIZES[2].color} 144deg 216deg,
                                ${PRIZES[3].color} 216deg 288deg,
                                ${PRIZES[4].color} 288deg 360deg
                            )`
                        }}
                    >
                    </div>

                    {/* Labels */}
                    {PRIZES.map((prize, i) => {
                        const segmentAngle = 360 / PRIZES.length; // 72
                        const angle = i * segmentAngle + (segmentAngle / 2); // Center of segment
                        return (
                            <div
                                key={i}
                                className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                style={{ transform: `rotate(${angle}deg)` }}
                            >
                                <div className="absolute top-[10%] left-1/2 -translate-x-1/2 flex flex-col items-center">
                                    <span className="font-bold text-lg md:text-xl drop-shadow-md" style={{ color: prize.text }}>
                                        {prize.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Center Hub */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-inner flex items-center justify-center z-10 border-4 border-gray-200">
                    <Sparkles className="text-yellow-500 w-8 h-8" />
                </div>
            </div>

            {/* Controls */}
            <div className="text-center">
                {!canSpin && nextSpinTime ? (
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 px-10">
                        <p className="text-gray-400 mb-2">Next Free Spin In</p>
                        <div className="text-3xl font-mono text-yellow-500 font-bold">{timeLeft}</div>
                    </div>
                ) : (
                    <button
                        onClick={handleSpin}
                        disabled={spinning}
                        className={`
                            relative px-12 py-4 rounded-full font-bold text-xl uppercase tracking-wider
                            transition-all transform hover:scale-105 active:scale-95 shadow-lg
                            ${spinning ? "bg-gray-500 cursor-not-allowed" : "bg-gradient-to-b from-yellow-400 to-yellow-600 text-black hover:shadow-yellow-500/50"}
                        `}
                    >
                        {spinning ? "Spinning..." : "SPIN NOW"}
                    </button>
                )}

                {/* Win Modal Message */}
                {lastWin && (
                    <div className="mt-6 animate-bounce">
                        <div className="bg-green-600 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 mx-auto w-fit shadow-lg">
                            <Gift className="w-5 h-5" />
                            YOU WON {lastWin.label}!
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
