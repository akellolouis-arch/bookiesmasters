"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { PARIPESA_AFFILIATE_URL } from "@/lib/affiliatePartners";

interface BannerItem {
  id: string;
  title: string;
  image: string;
  alt: string;
}

const BANNERS: BannerItem[] = [
  {
    id: "spain_vs_england",
    title: "Spain vs England",
    image: "/banners/paripesa/spain_vs_england.jpg",
    alt: "Paripesa Spain vs England Odds - Promo Code BKMS254",
  },
  {
    id: "belgium_vs_italy",
    title: "Belgium vs Italy",
    image: "/banners/paripesa/belgium_vs_italy.jpg",
    alt: "Paripesa Belgium vs Italy Odds - Promo Code BKMS254",
  },
  {
    id: "serbia_vs_germany",
    title: "Serbia vs Germany",
    image: "/banners/paripesa/serbia_vs_germany.jpg",
    alt: "Paripesa Serbia vs Germany Odds - Promo Code BKMS254",
  },
  {
    id: "portugal_vs_denmark",
    title: "Portugal vs Denmark",
    image: "/banners/paripesa/portugal_vs_denmark.jpg",
    alt: "Paripesa Portugal vs Denmark Odds - Promo Code BKMS254",
  },
  {
    id: "netherlands_vs_greece",
    title: "Netherlands vs Greece",
    image: "/banners/paripesa/netherlands_vs_greece.jpg",
    alt: "Paripesa Netherlands vs Greece Odds - Promo Code BKMS254",
  },
];

export default function ParipesaBanner() {
  const [selectedBanner, setSelectedBanner] = useState<BannerItem>(BANNERS[0]);

  useEffect(() => {
    // Randomly pick one of the 5 Paripesa banners on client mount
    const randomIndex = Math.floor(Math.random() * BANNERS.length);
    setSelectedBanner(BANNERS[randomIndex]);
  }, []);

  return (
    <div className="w-full my-4 px-1 sm:px-0">
      <a
        href={PARIPESA_AFFILIATE_URL}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="group block relative overflow-hidden rounded-xl border border-gray-200/90 bg-[#001050] shadow-xs animate-pulse-subtle transition-all duration-300 max-w-2xl mx-auto cursor-pointer aspect-[1024/341]"
        title="Paripesa Bonus with Promo Code BKMS254"
      >
        <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-slate-950">
          {/* Subtle ambient blur of the banner to fill widescreen seamlessly */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 blur-md scale-110 pointer-events-none"
            style={{ backgroundImage: `url(${selectedBanner.image})` }}
          />
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={selectedBanner.image}
              alt={selectedBanner.alt}
              width={1024}
              height={341}
              priority={false}
              className="w-full h-full object-contain group-hover:scale-[1.015] transition-transform duration-300"
            />
          </div>
        </div>
      </a>
    </div>
  );
}
