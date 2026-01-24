"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";

interface BetButtonProps {
    teamName?: string;
    odds?: { value: string; odd: string }[];
}

export default function BetButton({ teamName, odds }: BetButtonProps) {
    const [copied, setCopied] = useState(false);
    const PROMO_CODE = "BKMS254";
    const AFFILIATE_LINK = "https://1xbet.com/en/user/registration";

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        navigator.clipboard.writeText(PROMO_CODE);
        setCopied(true); // Trigger popup
    };

    const handleContinue = () => {
        window.open(AFFILIATE_LINK, "_blank");
        setCopied(false);
    };

    return (
        <>
            <button
                onClick={handleClick}
                className={`
            group relative overflow-hidden rounded-lg px-2 sm:px-4 py-2 
            bg-gradient-to-r from-[#004e92] to-[#000428] 
             hover:from-[#005bea] hover:to-[#00c6fb]
            text-white font-bold text-xs sm:text-sm shadow-md transition-all duration-300
            border border-white/10 hover:border-white/30
            flex items-center gap-2 sm:gap-4 justify-between w-full sm:w-auto
          `}
            >
                {/* Background Sheen */}
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />

                {/* Left: Promo Code */}
                <div className="flex flex-col items-start leading-none shrink-0">
                    <span className="text-[8px] sm:text-sm text-[#fb0] font-black uppercase tracking-widest mb-0.5 animate-pulse">
                        ✨ PROMOCODE ✨
                    </span>
                    <span className="text-white font-bold text-xs sm:text-sm tracking-wider font-mono">
                        {PROMO_CODE}
                    </span>
                </div>

                {/* Middle: CTA */}
                <div className="flex items-center gap-1 shrink-0">
                    <span className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />
                    <span className="font-bold text-xs sm:text-sm whitespace-nowrap">BET 1XBET</span>
                </div>

                {/* Right: Odds */}
                {odds && odds.length > 0 && (
                    <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
                        {odds.map((o, i) => (
                            <div key={i} className="flex flex-col items-center min-w-[24px]">
                                <span className="text-[8px] text-gray-400 font-bold leading-none mb-0.5">
                                    {o.value === "Home" ? "1" : o.value === "Draw" ? "X" : "2"}
                                </span>
                                <span className="text-[#fb0] font-bold text-[10px] sm:text-xs leading-none">
                                    {o.odd}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </button>

            {/* POPUP MODAL */}
            {copied && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#0f2d52] border border-[#1e4e8a] rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 relative">
                        {/* Close Button */}
                        <button
                            onClick={() => setCopied(false)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-white"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>

                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="bg-[#3dad07]/20 p-3 rounded-full">
                                <Check size={32} className="text-[#3dad07]" />
                            </div>

                            <h3 className="text-xl font-bold text-white">Promocode Copied!</h3>

                            <p className="text-sm text-gray-300 leading-relaxed">
                                Use code <span className="text-[#fb0] font-bold font-mono text-base">{PROMO_CODE}</span> to register and get <span className="text-[#fb0] font-bold">200% Bonus</span>!
                            </p>

                            <button
                                onClick={handleContinue}
                                className="w-full bg-[#3dad07] hover:bg-[#349606] text-white font-bold py-3 px-6 rounded-lg transition-transform active:scale-95 flex items-center justify-center gap-2 mt-2 shadow-lg hover:shadow-[#3dad07]/20"
                            >
                                CONTINUE TO 1XBET
                                <ExternalLink size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
