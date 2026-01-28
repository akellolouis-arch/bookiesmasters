"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check, ExternalLink } from "lucide-react";

export default function AffiliateBanner() {
    const [isVisible, setIsVisible] = useState(true);
    const [copied, setCopied] = useState(false);
    const PROMO_CODE = "BKMS254";
    const REGISTER_URL = "https://reffpa.com/L?tag=d_5148910m_97c_telegram&site=5148910&ad=97&r=registration";

    const handleCopy = () => {
        navigator.clipboard.writeText(PROMO_CODE);
        setCopied(true);
    };

    const handleContinue = () => {
        window.open(REGISTER_URL, "_blank");
        setCopied(false);
    };

    if (!isVisible) return null;

    return (
        <>
            <div
                onClick={handleCopy}
                className="fixed bottom-0 left-0 right-0 bg-[#0F2D52] text-white p-3 z-[40] border-t-2 border-[#54a7ff] shadow-[0_-4px_20px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-500 cursor-pointer hover:bg-[#153b6a] transition-colors"
            >
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 sm:gap-6">

                    {/* Left Text */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            <span className="font-black text-lg sm:text-xl text-[#01a0ff] drop-shadow-sm italic leading-none">
                                1XBET
                            </span>
                            <span className="bg-[#fb0] text-[#0F2D52] text-[9px] font-bold px-1 rounded-sm uppercase tracking-wide animate-pulse whitespace-nowrap">
                                Special Offer
                            </span>
                        </div>
                        <p className="text-[10px] sm:text-sm text-gray-200 leading-tight">
                            Register now & get <span className="text-[#fb0] font-bold">200% Bonus</span>. use <span className="text-[#fb0] font-bold">PROMOCODE</span>
                        </p>
                    </div>

                    {/* Promo Code Action */}
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span className="animate-pulse text-xs sm:text-sm text-[#fb0] uppercase tracking-widest font-black mr-1 drop-shadow-sm">
                            ✨ PROMOCODE ✨
                        </span>
                        <div className="flex items-center gap-1 bg-[#0b223f] rounded px-1 py-0.5 border border-[#1e4e8a]">
                            <div className="text-white font-mono font-bold text-[10px] tracking-widest px-1">
                                {PROMO_CODE}
                            </div>
                            <button
                                className="bg-[#3dad07] hover:bg-[#349606] text-white text-[9px] font-bold py-0.5 px-1.5 rounded transition-colors flex items-center gap-1 shadow-sm"
                            >
                                {copied ? <Check size={10} /> : <Copy size={10} />}
                                {copied ? "COPIED" : "COPY"}
                            </button>
                        </div>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsVisible(false);
                        }}
                        className="text-blue-300 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
                    >
                        <X size={20} />
                    </button>

                </div>
            </div>

            {/* POPUP MODAL */}
            {copied && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#0f2d52] border border-[#1e4e8a] rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 relative">
                        {/* Close Button */}
                        <button
                            onClick={() => setCopied(false)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-white"
                        >
                            <X size={20} />
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
