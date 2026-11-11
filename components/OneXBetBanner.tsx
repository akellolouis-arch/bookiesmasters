"use client";

import React from "react";
import Image from "next/image";
import { ChevronUp } from "lucide-react";
import { ONEXBET_AFFILIATE_URL } from "@/lib/affiliatePartners";

export default function OneXBetBanner() {
  return (
    <div className="w-full max-w-2xl mx-auto my-2.5 px-1 sm:px-0">
      <a
        href={ONEXBET_AFFILIATE_URL}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="group block relative overflow-hidden rounded-2xl bg-[#0c2937] hover:bg-[#0e3142] p-3 sm:p-3.5 shadow-md border border-cyan-500/20 transition-all duration-200 cursor-pointer"
        title="1xBet 200% Welcome Bonus up to KSh 20,000"
      >
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* 1XBET Logo */}
            <div className="relative w-16 sm:w-20 h-5 sm:h-6 flex-shrink-0">
              <Image
                src="/banners/1xbet/1xbet_logo.svg"
                alt="1XBET Logo"
                fill
                priority={false}
                className="object-contain"
              />
            </div>

            {/* Offer Heading */}
            <span className="text-white font-bold text-xs sm:text-[13px] leading-tight">
              200% Welcome Bonus up to{" "}
              <span className="text-[#00a3e0] font-extrabold whitespace-nowrap">
                KSh 20,000
              </span>
            </span>
          </div>

          {/* Chevron Collapse Indicator (Flashscore Style) */}
          <ChevronUp className="w-4 h-4 text-white/70 flex-shrink-0 group-hover:text-white transition-colors" />
        </div>

        {/* Responsible Gaming Disclaimer */}
        <p className="text-[9px] sm:text-[10px] text-gray-300/80 mb-2 font-normal tracking-wide">
          Gamble Responsibly. Terms &amp; Conditions apply. 18+
        </p>

        {/* Full-Width White Action Button */}
        <div className="w-full bg-white hover:bg-gray-100 text-[#0c2937] font-black py-2 sm:py-2.5 rounded-xl text-center text-xs sm:text-sm tracking-wide transition-colors shadow-xs group-hover:shadow-md flex items-center justify-center">
          1xbet
        </div>
      </a>

      {/* Subtle Advertisement Label */}
      <div className="text-[8px] sm:text-[9px] text-gray-400 font-medium text-center uppercase tracking-widest mt-1">
        Advertisement
      </div>
    </div>
  );
}

