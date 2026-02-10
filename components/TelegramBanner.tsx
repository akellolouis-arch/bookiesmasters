"use client";

import { useState } from "react";
import { X, Send, ExternalLink, Trophy } from "lucide-react";

export default function TelegramBanner() {
    const [isVisible, setIsVisible] = useState(true);

    const TELEGRAM_LINK = "https://t.me/bookiesm";

    const handleJoin = () => {
        // Meta Pixel Track
        if (typeof window !== 'undefined' && (window as any).fbq) {
            (window as any).fbq('track', 'Lead', {
                content_name: 'Sticky Telegram Banner',
                content_category: 'Social'
            });
        }
        window.open(TELEGRAM_LINK, "_blank");
    };

    if (!isVisible) return null;

    return (
        <div
            onClick={handleJoin}
            className="fixed bottom-0 left-0 right-0 z-[50] cursor-pointer animate-in slide-in-from-bottom duration-500"
        >
            {/* Main Gradient Banner - GREEN THEME */}
            <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-500 shadow-[0_-4px_25px_rgba(22,163,74,0.5)] border-t border-green-400/40 relative overflow-hidden">

                {/* Pulse Effect Overlay */}
                <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none" />

                {/* BRIGHT Confetti / Celebration Decoration */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {/* Floating Gold Stars & Sparkles */}
                    <div className="absolute top-[-5px] left-[8%] text-yellow-300 text-lg animate-[bounce_3s_infinite] opacity-90 drop-shadow-sm">★</div>
                    <div className="absolute bottom-[20%] left-[2%] text-yellow-200 text-xs animate-[spin_4s_linear_infinite] opacity-70">✦</div>
                    <div className="absolute top-[20%] left-[30%] text-white text-[10px] animate-pulse opacity-60">●</div>

                    <div className="absolute top-[10%] right-[25%] text-yellow-400 text-xl animate-[pulse_2s_infinite] opacity-100 drop-shadow-md">✨</div>
                    <div className="absolute bottom-[5%] right-[10%] text-yellow-300 text-sm animate-[bounce_2.5s_infinite] opacity-80">★</div>
                    <div className="absolute top-[-2px] right-[5%] text-white/90 text-xs animate-[ping_3s_infinite]">✦</div>

                    {/* SVG Confetti Pieces */}
                    <svg className="absolute top-2 left-1/4 w-3 h-3 text-red-400/80 animate-[spin_5s_linear_infinite]" viewBox="0 0 24 24" fill="currentColor"><rect width="24" height="24" /></svg>
                    <svg className="absolute bottom-1 right-1/3 w-2 h-2 text-blue-300/80 animate-[bounce_4s_infinite]" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg>
                </div>

                <div className="max-w-4xl mx-auto flex items-center justify-between px-3 py-2 sm:px-4 relative z-10">

                    {/* Left: Icon & Strong Text */}
                    <div className="flex-1 min-w-0 flex items-center gap-2.5">
                        <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm border border-white/20 shadow-inner shrink-0 ring-1 ring-white/10">
                            <Trophy className="w-5 h-5 text-yellow-200 drop-shadow-md" />
                        </div>
                        <div className="flex flex-col justify-center">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="bg-red-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-sm animate-pulse border border-red-400">
                                    VIP
                                </span>
                                <span className="text-[10px] font-black text-green-100 uppercase tracking-widest leading-none drop-shadow-sm">
                                    HIGHSTAKE ODDS
                                </span>
                            </div>
                            <span className="text-white font-medium text-sm sm:text-base italic leading-none drop-shadow-md opacity-95">
                                unlock 3+ odds
                            </span>
                        </div>
                    </div>

                    {/* Right: CTA Button */}
                    <div className="shrink-0 pl-2 mr-6 sm:mr-0"> {/* Added margin-right for mobile to avoid X overlap if needed, though X is absolute */}
                        <button className="bg-black/30 hover:bg-black/50 text-white font-bold py-1.5 px-3.5 rounded-lg border border-white/30 shadow-lg flex items-center gap-2 transition-all active:scale-95 group">
                            <span className="text-[10px] sm:text-xs uppercase tracking-wide group-hover:text-yellow-200 transition-colors">JOIN NOW</span>
                            <Send size={14} className="text-[#0088cc] transform -rotate-45 translate-x-0.5 translate-y-[-1px] drop-shadow-sm" />
                        </button>
                    </div>

                    {/* Close Button - Larger and Top Right */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsVisible(false);
                        }}
                        className="absolute top-0 right-0 p-2 sm:p-2.5 text-white/70 hover:text-white hover:bg-black/20 rounded-bl-xl transition-all z-50"
                    >
                        <X size={22} strokeWidth={2.5} className="drop-shadow-md" />
                    </button>

                </div>
            </div>
        </div>
    );
}
