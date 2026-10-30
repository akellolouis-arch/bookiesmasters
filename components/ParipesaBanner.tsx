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
    id: "chelsea_vs_man_united",
    title: "Chelsea vs Man United",
    image: "/banners/paripesa/chelsea_vs_man_united.jpg",
    alt: "Paripesa Chelsea vs Man United",
  },
  {
    id: "liverpool_vs_arsenal",
    title: "Liverpool vs Arsenal",
    image: "/banners/paripesa/liverpool_vs_arsenal.jpg",
    alt: "Paripesa Liverpool vs Arsenal",
  },
  {
    id: "racing_vs_real_madrid",
    title: "Racing vs Real Madrid",
    image: "/banners/paripesa/racing_vs_real_madrid.jpg",
    alt: "Paripesa Racing vs Real Madrid",
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
    <div className="w-full my-4 px-1 sm:px-0">
      <a
        href={PARIPESA_AFFILIATE_URL}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="group block relative overflow-hidden rounded-xl border border-gray-200/90 bg-white shadow-xs animate-pulse-subtle transition-all duration-300 max-w-lg mx-auto cursor-pointer"
        title="Paripesa"
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
        </div>
      </a>
    </div>
  );
}
