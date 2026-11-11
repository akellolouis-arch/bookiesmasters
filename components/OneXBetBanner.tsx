"use client";

import React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ONEXBET_AFFILIATE_URL } from "@/lib/affiliatePartners";

export default function OneXBetBanner() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <div className="w-full bg-[#0c2937] border-b border-cyan-500/20 m-0 p-0">
      <div className="w-full md:max-w-2xl lg:max-w-2xl mx-auto">
        <a
          href={ONEXBET_AFFILIATE_URL}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="group block relative overflow-hidden bg-[#0c2937] hover:bg-[#0e3142] px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-200 cursor-pointer w-full"
          title="1xBet 200% Welcome Bonus"
        >
          <div className="flex items-center justify-between gap-2">
            {/* Left: 1XBET Logo + Offer + Responsible Gaming text */}
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

              <div className="flex flex-col justify-center min-w-0">
                <span className="text-cyan-400 font-medium text-xs sm:text-sm tracking-tight truncate">
                  200% Welcome Bonus
                </span>
                <span className="text-[8.5px] sm:text-[9.5px] text-gray-300/80 font-normal truncate">
                  Gamble Responsibly. Terms &amp; Conditions apply. 18+
                </span>
              </div>
            </div>

            {/* Right: Clean White Action Button with lighter font boldness */}
            <div className="flex-shrink-0">
              <span className="inline-flex items-center justify-center bg-white hover:bg-gray-100 text-[#0c2937] font-medium px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm tracking-wide transition-transform group-hover:scale-105 shadow-xs">
                1xbet
              </span>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}
