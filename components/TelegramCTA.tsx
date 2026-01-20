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
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-[100] max-w-sm">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 relative overflow-hidden group border border-white/10">

                {/* Close Button */}
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute top-2 right-2 text-blue-200 hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>

                {/* Content */}
                <div className="flex flex-col gap-1 z-10 pr-6">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Send size={16} className="text-white" />
                        Join Our Telegram Channel
                    </h3>
                </div>

                {/* Button */}
                <a
                    href="https://t.me/bookiesm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-blue-600 text-xs font-bold py-2 px-4 rounded-full shadow hover:bg-blue-50 hover:text-blue-700 transition-transform active:scale-95 flex items-center gap-1 z-10 whitespace-nowrap"
                >
                    Join
                </a>
            </div>
        </div>
    );
}
