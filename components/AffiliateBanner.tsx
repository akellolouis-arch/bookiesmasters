"use client";

import { useState } from "react";
import { X, Send, ExternalLink } from "lucide-react";

export default function AffiliateBanner() {
    const [isVisible, setIsVisible] = useState(true);

    const TELEGRAM_LINK = "https://t.me/bookiesm";

    const handleJoin = () => {
        window.open(TELEGRAM_LINK, "_blank");
    };

    if (!isVisible) return null;

    return (
        <div
            onClick={handleJoin}
            className="fixed bottom-0 left-0 right-0 bg-[#0088cc] text-white p-3 z-[40] border-t-2 border-[#54a7ff] shadow-[0_-4px_20px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom duration-500 cursor-pointer hover:bg-[#0077b5] transition-colors"
        >
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 sm:gap-6">

                {/* Left Text */}
                <div className="flex-1 min-w-0 flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full shrink-0">
                        <Send size={24} className="text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-black text-lg sm:text-xl text-white drop-shadow-sm leading-none">
                                TELEGRAM
                            </span>
                            <span className="bg-white text-[#0088cc] text-[9px] font-bold px-1 rounded-sm uppercase tracking-wide animate-pulse whitespace-nowrap">
                                FREE TIPS
                            </span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-blue-100 leading-tight">
                            Join our channel for daily <span className="font-bold text-white">Sure Bets</span> & <span className="font-bold text-white">Live Updates</span>
                        </p>
                    </div>
                </div>

                {/* Action Button */}
                <div className="shrink-0 flex items-center">
                    <button
                        className="bg-white text-[#0088cc] hover:bg-gray-100 font-bold py-2 px-4 rounded-lg text-xs sm:text-sm shadow-md transition-transform active:scale-95 flex items-center gap-1.5 whitespace-nowrap"
                    >
                        <span>JOIN NOW</span>
                        <ExternalLink size={14} />
                    </button>
                </div>

                {/* Close Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsVisible(false);
                    }}
                    className="absolute top-2 right-2 sm:static text-blue-200 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
                >
                    <X size={18} />
                </button>

            </div>
        </div>
    );
}
