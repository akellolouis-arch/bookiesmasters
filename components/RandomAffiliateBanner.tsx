"use client";

import React from "react";
import ParipesaBanner from "@/components/ParipesaBanner";
import MegapariBanner from "@/components/MegapariBanner";
import MelbetBanner from "@/components/MelbetBanner";

export type AffiliateBannerEntry =
  | { brand: "paripesa"; variantId: string }
  | { brand: "megapari"; variantId: string }
  | { brand: "melbet"; variantId: "melbet_bonus_100" };

export const AFFILIATE_BANNER_POOL: AffiliateBannerEntry[] = [
  { brand: "paripesa", variantId: "barcelona_vs_villarreal" },
  { brand: "paripesa", variantId: "real_madrid_vs_celta" },
  { brand: "paripesa", variantId: "liverpool_vs_man_united" },
  { brand: "paripesa", variantId: "newcastle_vs_arsenal" },
  { brand: "megapari", variantId: "megapari_kane" },
  { brand: "megapari", variantId: "megapari_yamal" },
  { brand: "melbet", variantId: "melbet_bonus_100" },
];

export function shuffleAffiliateBanners(): AffiliateBannerEntry[] {
  const copy = [...AFFILIATE_BANNER_POOL];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function RandomAffiliateBanner({ entry }: { entry: AffiliateBannerEntry }) {
  if (entry.brand === "paripesa") {
    return <ParipesaBanner variantId={entry.variantId} />;
  }
  if (entry.brand === "megapari") {
    return <MegapariBanner variantId={entry.variantId} />;
  }
  return <MelbetBanner />;
}
