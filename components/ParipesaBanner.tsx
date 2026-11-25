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
    id: "arsenal_vs_man_city",
    title: "Arsenal vs Man City",
    image: "/banners/paripesa/arsenal_vs_man_city_wide.jpg",
    alt: "Paripesa Arsenal vs Man City Odds - Promo Code BKMS254",
  },
  {
    id: "everton_vs_liverpool",
    title: "Everton vs Liverpool",
    image: "/banners/paripesa/everton_vs_liverpool_wide.jpg",
    alt: "Paripesa Everton vs Liverpool Odds - Promo Code BKMS254",
  },
];

export default function ParipesaBanner({
  initialIndex = 0,
  variantId,
}: {
  initialIndex?: number;
  variantId?: string;
}) {
  const pinnedBanner = variantId ? BANNERS.find((b) => b.id === variantId) : undefined;
  const safeInitial = ((initialIndex % BANNERS.length) + BANNERS.length) % BANNERS.length;
  const [selectedBanner, setSelectedBanner] = useState<BannerItem>(pinnedBanner || BANNERS[safeInitial]);

  useEffect(() => {
    if (pinnedBanner) {
      setSelectedBanner(pinnedBanner);
      return;
    }
    // Randomly pick one of the 4 Paripesa banners on client mount when not pinned
    const randomIndex = Math.floor(Math.random() * BANNERS.length);
    setSelectedBanner(BANNERS[randomIndex]);
  }, [pinnedBanner]);

  return (
    <div className="w-full my-3 px-1 sm:px-0">
      <a
        href={PARIPESA_AFFILIATE_URL}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="group block relative overflow-hidden rounded-xl border border-gray-200/90 bg-slate-950 shadow-xs animate-pulse-subtle transition-all duration-300 max-w-2xl mx-auto cursor-pointer aspect-[1024/341]"
        title="Paripesa Bonus with Promo Code BKMS254"
      >
        <div className="relative w-full h-full overflow-hidden">
          <Image
            src={selectedBanner.image}
            alt={selectedBanner.alt}
            width={1024}
            height={341}
            priority={false}
            className="w-full h-full object-contain group-hover:scale-[1.015] transition-transform duration-300"
          />
        </div>
      </a>
    </div>
  );
}
