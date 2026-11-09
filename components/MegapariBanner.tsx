"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { MEGAPARI_AFFILIATE_URL } from "@/lib/affiliatePartners";

interface BannerItem {
  id: string;
  title: string;
  image: string;
  alt: string;
}

const BANNERS: BannerItem[] = [
  {
    id: "megapari_kane",
    title: "Megapari Harry Kane 200% Welcome Bonus",
    image: "/banners/megapari/megapari_kane_200.jpg",
    alt: "Megapari 200% Welcome Bonus on First Deposits - Promo Code BKMS254",
  },
  {
    id: "megapari_yamal",
    title: "Megapari Lamine Yamal 200% Welcome Bonus",
    image: "/banners/megapari/megapari_yamal_200.jpg",
    alt: "Megapari 200% Welcome Bonus on First Deposits - Promo Code BKMS254",
  },
];

export default function MegapariBanner() {
  const [selectedBanner, setSelectedBanner] = useState<BannerItem>(BANNERS[0]);

  useEffect(() => {
    // Randomly pick one of the 2 Megapari horizontal banners on client mount
    const randomIndex = Math.floor(Math.random() * BANNERS.length);
    setSelectedBanner(BANNERS[randomIndex]);
  }, []);

  return (
    <div className="w-full my-4 px-1 sm:px-0">
      <a
        href={MEGAPARI_AFFILIATE_URL}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="group block relative overflow-hidden rounded-xl border border-gray-200/90 bg-slate-950 shadow-xs animate-pulse-subtle transition-all duration-300 max-w-2xl mx-auto cursor-pointer aspect-[1024/341]"
        title="Megapari 200% Welcome Bonus with Promo Code BKMS254"
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
