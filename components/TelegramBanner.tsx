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
            <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-500 shadow-[0_-4px_25px_rgba(22,163,74,0.4)] border-t border-green-400/30">

                {/* Pulse Effect Overlay */}
                <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none" />

                {/* Confetti / Celebration Decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                    {/* CSS-based Confetti Particles */}
                    <div className="absolute top-[-2px] left-[10%] text-yellow-300 transform rotate-12 animate-pulse">✦</div>
                    <div className="absolute top-[20%] left-[85%] text-yellow-300 transform -rotate-12 animate-ping">✦</div>
                    <div className="absolute top-[40%] left-[50%] text-white/50 transform rotate-45 text-xs">●</div>
                    <div className="absolute bottom-[10%] left-[20%] text-emerald-200 transform -rotate-45 text-xs">■</div>
                    <div className="absolute top-[10%] right-[10%] text-red-200 transform rotate-12 text-xs">▲</div>

                    {/* SVG Sparkles */}
                    <svg className="absolute top-1 left-4 w-6 h-6 text-yellow-400 opacity-60 animate-spin-slow" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                    <svg className="absolute bottom-1 right-20 w-4 h-4 text-white opacity-40 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M5 3v4M3 5h4M6 17v4M4 19h4M13 3l3.293 3.293M16.293 3L13 6.293M6 6l3.293 3.293M9.293 6L6 9.293" />
                    </svg>
                </div>

                <div className="max-w-4xl mx-auto flex items-center justify-between px-3 py-1.5 sm:px-4 relative">

                    {/* Left: Icon & Strong Text */}
                    <div className="flex-1 min-w-0 flex items-center gap-2.5">
                        <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm border border-white/10 shadow-inner shrink-0">
                            <Trophy className="w-4 h-4 text-green-100 drop-shadow-md" />
                        </div>
                        <div className="flex flex-col justify-center">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="bg-red-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-sm animate-pulse">
                                    VIP
                                </span>
                                <span className="text-[9px] font-bold text-green-100 uppercase tracking-widest leading-none">
                                    HIGHSTAKE ODDS
                                </span>
                            </div>
                            <span className="text-white font-medium text-sm sm:text-base italic leading-none drop-shadow-sm">
                                unlock 3+ odds
                            </span>
                        </div>
                    </div>

                    {/* Right: CTA Button */}
                    <div className="shrink-0 pl-2">
                        <button className="bg-black/30 hover:bg-black/40 text-white font-bold py-1.5 px-3 rounded-lg border border-white/20 shadow-lg flex items-center gap-2 transition-transform active:scale-95">
                            <span className="text-[10px] sm:text-xs uppercase tracking-wide">JOIN NOW</span>
                            <Send size={14} className="text-[#0088cc] transform -rotate-45 translate-x-0.5 translate-y-[-1px]" />
                        </button>
                    </div>

                    {/* Close Button (Moved to top-right corner of banner) */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsVisible(false);
                        }}
                        className="absolute top-1 right-1 p-1 text-green-200 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={12} />
                    </button>

                </div>
            </div>
        </div>
    );
}
