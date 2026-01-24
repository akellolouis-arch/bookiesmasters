"use client";

import React from "react";
import { Send } from "lucide-react";

export default function TelegramCTA() {
    return (
        <div className="w-full bg-blue-950/95 border-t border-blue-500/30 p-4 mt-auto">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600/20 p-2 rounded-full">
                        <Send size={20} className="text-blue-400" />
                    </div>
                    <div className="text-center sm:text-left">
                        <h3 className="text-sm font-bold text-gray-200">
                            Join our Telegram Community
                        </h3>
                        <p className="text-xs text-gray-400">
                            Get free daily tips, live bets & exclusive insights
                        </p>
                    </div>
                </div>

                <a
                    href="https://t.me/bookiesm"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                        if (typeof window !== 'undefined' && (window as any).fbq) {
                            (window as any).fbq('track', 'Lead', {
                                content_name: 'Telegram Join',
                                content_category: 'Social'
                            });
                        }
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-6 rounded shadow transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                    <span>JOIN CHANNEL</span>
                    <Send size={12} className="-rotate-45" />
                </a>
            </div>
        </div>
    );
}
