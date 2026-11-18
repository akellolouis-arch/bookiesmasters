"use client";

import React, { useEffect, useState } from "react";
import ParipesaBanner from "@/components/ParipesaBanner";
import MegapariBanner from "@/components/MegapariBanner";
import MelbetBanner from "@/components/MelbetBanner";

interface RandomAffiliateBannerProps {
  slotIndex: number;
}

const AFFILIATE_BANNERS = ["paripesa", "megapari", "melbet"] as const;

export default function RandomAffiliateBanner({ slotIndex }: RandomAffiliateBannerProps) {
  const deterministicIdx =
    (((slotIndex - 1) % AFFILIATE_BANNERS.length) + AFFILIATE_BANNERS.length) %
    AFFILIATE_BANNERS.length;
  const [bannerIdx, setBannerIdx] = useState<number>(deterministicIdx);

  useEffect(() => {
    setBannerIdx(Math.floor(Math.random() * AFFILIATE_BANNERS.length));
  }, []);

  const kind = AFFILIATE_BANNERS[bannerIdx];

  if (kind === "paripesa") {
    return <ParipesaBanner initialIndex={slotIndex} />;
  }
  if (kind === "megapari") {
    return <MegapariBanner />;
  }
  return <MelbetBanner />;
}
