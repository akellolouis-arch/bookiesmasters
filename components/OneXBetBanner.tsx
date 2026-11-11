"use client";

import React from "react";
import Image from "next/image";
import { ONEXBET_AFFILIATE_URL } from "@/lib/affiliatePartners";

export default function OneXBetBanner() {
  return (
    <div className="w-full bg-[#0c2937] border-b border-cyan-500/20 shadow-xs relative z-40">
      <a
        href={ONEXBET_AFFILIATE_URL}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="group max-w-7xl mx-auto px-2 sm:px-4 md:px-8 h-10 sm:h-12 flex items-center justify-between gap-2 transition-colors hover:bg-[#0e3142] cursor-pointer"
        title="1xBet 200% Welcome Bonus"
      >
        {/* Left: 1XBET Logo + Offer */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="relative w-14 sm:w-16 h-4 sm:h-5 flex-shrink-0">
            <Image
              src="/banners/1xbet/1xbet_logo.svg"
              alt="1XBET Logo"
              fill
              priority={false}
              className="object-contain"
            />
          </div>

          <span className="text-white font-extrabold text-xs sm:text-sm tracking-tight truncate">
            200% Welcome Bonus
          </span>

          <span className="hidden md:inline-block text-[10px] text-gray-300/80 font-normal">
            • Gamble Responsibly 18+
          </span>
        </div>

        {/* Right: White Action Button */}
        <div className="flex-shrink-0">
          <span className="inline-flex items-center justify-center bg-white hover:bg-gray-100 text-[#0c2937] font-black px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm tracking-wide transition-transform group-hover:scale-105 shadow-xs">
            1xbet
          </span>
        </div>
      </a>
    </div>
  );
}
