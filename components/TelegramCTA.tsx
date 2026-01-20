
"use client";

import React from "react";
import { Send } from "lucide-react";

export default function TelegramCTA() {
    return (
        <div className="w-full bg-[#1e1e1e] border-t border-white/5 py-8 mt-12">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-lg group">

                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />

                    <div className="relative z-10 text-center md:text-left">
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-2 flex items-center justify-center md:justify-start gap-2">
                            <Send className="w-6 h-6 md:w-8 md:h-8" />
                            Join Our Telegram Channel
                        </h3>
                        <p className="text-blue-100 text-sm md:text-base max-w-md">
                            Get free daily tips, live in-play bets, and exclusive jackpot analysis directly to your phone.
                        </p>
                    </div>

                    <a
                        href="https://t.me/bookiesm" // Update with actual channel link
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative z-10 bg-white text-blue-600 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-blue-50 hover:text-blue-700 transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                    >
                        <span>Join Now</span>
                        <Send size={16} className="-rotate-45" />
                    </a>
                </div>
            </div>
        </div>
    );
}
