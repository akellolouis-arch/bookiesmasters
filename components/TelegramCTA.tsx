"use client";

import React, { useState, useEffect } from "react";
import { Send, X } from "lucide-react";

export default function TelegramCTA() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Minor delay for smooth entrance
        const timer = setTimeout(() => setIsVisible(true), 1000);
        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] animate-in slide-in-from-bottom-full duration-700">
            {/* Full width strip, no radius, top border only */}
            <div className="bg-blue-950/95 backdrop-blur-md border-t border-blue-500/30 p-2 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">

                {/* Content Container - Centered max-width */}
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-2 md:px-4 relative">

                    {/* Content Group */}
                    <div className="flex items-center gap-3">
                        {/* Close Button - Inline now */}
                        <button
                            onClick={() => setIsVisible(false)}
                            className="text-gray-400 hover:text-white transition-colors p-1"
                        >
                            <X size={14} />
                        </button>

                        <div className="bg-blue-600/20 p-1.5 rounded-full hidden xs:block">
                            <Send size={14} className="text-blue-400" />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                            <h3 className="text-xs font-bold text-gray-200 leading-tight">
                                Join our Telegram
                            </h3>
                            <p className="text-[10px] text-gray-400 leading-none hidden sm:block">
                                for free daily tips & live bets
                            </p>
                        </div>
                    </div>

                    {/* Button */}
                    <a
                        href="https://t.me/bookiesm"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                            // Track Lead on click
                            if (typeof window !== 'undefined' && (window as any).fbq) {
                                (window as any).fbq('track', 'Lead', {
                                    content_name: 'Telegram Join',
                                    content_category: 'Social'
                                });
                            }
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-1.5 px-6 rounded-sm shadow transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                        <span>JOIN NOW</span>
                        <Send size={10} className="-rotate-45" />
                    </a>
                </div>
            </div>
        </div>
    );
}
