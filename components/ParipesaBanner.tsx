"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ExternalLink, Sparkles } from "lucide-react";
import { PARIPESA_AFFILIATE_URL } from "@/lib/affiliatePartners";

interface BannerItem {
  id: string;
  title: string;
  image: string;
  alt: string;
}

const BANNERS: BannerItem[] = [
  {
    id: "chelsea_vs_man_united",
    title: "Chelsea vs Man United - Paripesa Special Odds",
    image: "/banners/paripesa/chelsea_vs_man_united.jpg",
    alt: "Paripesa Chelsea vs Man United Special Odds with Promo Code BKMS254",
  },
  {
    id: "liverpool_vs_arsenal",
    title: "Liverpool vs Arsenal - Paripesa Special Odds",
    image: "/banners/paripesa/liverpool_vs_arsenal.jpg",
    alt: "Paripesa Liverpool vs Arsenal Special Odds with Promo Code BKMS254",
  },
  {
    id: "racing_vs_real_madrid",
    title: "Racing vs Real Madrid - Paripesa Special Odds",
    image: "/banners/paripesa/racing_vs_real_madrid.jpg",
    alt: "Paripesa Racing vs Real Madrid Special Odds with Promo Code BKMS254",
  },
];

export default function ParipesaBanner() {
  const [selectedBanner, setSelectedBanner] = useState<BannerItem>(BANNERS[0]);

  useEffect(() => {
    // Randomly pick one of the 3 banners on client mount
    const randomIndex = Math.floor(Math.random() * BANNERS.length);
    setSelectedBanner(BANNERS[randomIndex]);
  }, []);

  return (
    <div className="w-full my-5 px-1 sm:px-0">
      <div className="flex items-center justify-between mb-1.5 px-1 text-gray-500">
        <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-teal-800">
          <Sparkles size={12} className="text-amber-500 fill-amber-500" />
          <span>Sponsored Match Special</span>
        </span>
        <span className="text-[10px] font-semibold text-gray-600">
          Promo Code: <strong className="text-teal-700 font-bold">BKMS254</strong>
        </span>
      </div>

      <a
        href={PARIPESA_AFFILIATE_URL}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="group block relative overflow-hidden rounded-xl border border-gray-200/90 bg-white shadow-xs hover:shadow-md transition-all duration-300 max-w-lg mx-auto cursor-pointer"
        title="Bet on Paripesa with promo code BKMS254"
      >
        <div className="relative w-full aspect-square bg-slate-950 overflow-hidden">
          <Image
            src={selectedBanner.image}
            alt={selectedBanner.alt}
            width={600}
            height={600}
            priority={false}
            className="w-full h-full object-contain group-hover:scale-[1.015] transition-transform duration-300"
          />

          {/* Quick CTA overlay badge on hover */}
          <div className="absolute bottom-3 right-3 opacity-90 group-hover:opacity-100 transition-opacity">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-600 group-hover:bg-teal-700 text-white text-[11px] font-bold shadow-md transition-colors">
              <span>Bet on Paripesa</span>
              <ExternalLink size={12} />
            </span>
          </div>
        </div>
      </a>
    </div>
  );
}

