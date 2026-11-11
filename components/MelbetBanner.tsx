"use client";

import React from "react";
import Image from "next/image";
import { MELBET_AFFILIATE_URL } from "@/lib/affiliatePartners";

export default function MelbetBanner() {
  return (
    <div className="w-full my-3 px-1 sm:px-0">
      <a
        href={MELBET_AFFILIATE_URL}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="group block relative overflow-hidden rounded-xl border border-gray-200/90 bg-slate-950 shadow-xs animate-pulse-subtle transition-all duration-300 max-w-2xl mx-auto cursor-pointer aspect-[468/60]"
        title="Melbet Exclusive Bonus on First Deposit $100"
      >
        <div className="relative w-full h-full overflow-hidden">
          <Image
            src="/banners/melbet/melbet_bonus_100_2x.webp"
            alt="Melbet Exclusive Bonus on First Deposit $100 - Crypto Friendly"
            width={936}
            height={120}
            priority={false}
            className="w-full h-full object-cover group-hover:scale-[1.015] transition-transform duration-300"
          />
        </div>
      </a>
    </div>
  );
}

