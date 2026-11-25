"use client";

import React from "react";
import ParipesaBanner from "@/components/ParipesaBanner";
import MegapariBanner from "@/components/MegapariBanner";
import MelbetBanner from "@/components/MelbetBanner";

export type AffiliateBannerEntry =
  | { brand: "paripesa"; variantId: string }
  | { brand: "megapari"; variantId: string }
  | { brand: "melbet"; variantId: "melbet_bonus_100" };

const MELBET_BANNERS: AffiliateBannerEntry[] = [
  { brand: "melbet", variantId: "melbet_bonus_100" },
];

const MEGAPARI_BANNERS: AffiliateBannerEntry[] = [
  { brand: "megapari", variantId: "megapari_kane" },
  { brand: "megapari", variantId: "megapari_yamal" },
];

const PARIPESA_BANNERS: AffiliateBannerEntry[] = [
  { brand: "paripesa", variantId: "arsenal_vs_man_city" },
  { brand: "paripesa", variantId: "everton_vs_liverpool" },
];

export const AFFILIATE_BANNER_POOL: AffiliateBannerEntry[] = [
  ...PARIPESA_BANNERS,
  ...MEGAPARI_BANNERS,
  ...MELBET_BANNERS,
];

function shuffleArray<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Selects a deduplicated set of affiliate banners guaranteeing at least one banner
 * from every affiliate brand (Melbet, Megapari, Paripesa) and adding remaining variants
 * up to all 7 banners as match volume grows.
 */
export function selectUniqueAffiliateBanners(
  totalMatches: number,
  randomize = true
): AffiliateBannerEntry[] {
  const desiredCount = Math.min(
    AFFILIATE_BANNER_POOL.length,
    Math.max(3, Math.ceil(totalMatches / 15) + 1)
  );

  const melbet = randomize ? shuffleArray(MELBET_BANNERS) : [...MELBET_BANNERS];
  const megapari = randomize ? shuffleArray(MEGAPARI_BANNERS) : [...MEGAPARI_BANNERS];
  const paripesa = randomize ? shuffleArray(PARIPESA_BANNERS) : [...PARIPESA_BANNERS];

  // Guarantee at least 1 banner per affiliate brand
  const guaranteed: AffiliateBannerEntry[] = [melbet[0], megapari[0], paripesa[0]];
  const extrasPool = [...megapari.slice(1), ...paripesa.slice(1)];
  const orderedExtras = randomize ? shuffleArray(extrasPool) : extrasPool;

  const combined = [
    ...guaranteed,
    ...orderedExtras.slice(0, Math.max(0, desiredCount - guaranteed.length)),
  ];

  return randomize ? shuffleArray(combined) : combined;
}

export interface AffiliatePlacementPlan {
  inlineByMatchNumber: Map<number, AffiliateBannerEntry>;
  preChildrenBanners: AffiliateBannerEntry[];
  footerBanners: AffiliateBannerEntry[];
}

/**
 * Distributes banners evenly across the rendered match list while ensuring:
 * 1) Every brand appears at least once on the page without any duplicate banner.
 * 2) At least one banner always renders right before <Footer />.
 */
export function buildAffiliatePlacementPlan(
  totalMatches: number,
  deck: AffiliateBannerEntry[],
  hasChildren: boolean
): AffiliatePlacementPlan {
  const inlineByMatchNumber = new Map<number, AffiliateBannerEntry>();
  const preChildrenBanners: AffiliateBannerEntry[] = [];
  let footerBanners: AffiliateBannerEntry[] = [];

  if (!deck || deck.length === 0) {
    return { inlineByMatchNumber, preChildrenBanners, footerBanners };
  }

  if (totalMatches === 0) {
    if (hasChildren) {
      preChildrenBanners.push(deck[0]);
      footerBanners = deck.slice(1);
    } else {
      footerBanners = [...deck];
    }
    return { inlineByMatchNumber, preChildrenBanners, footerBanners };
  }

  if (totalMatches === 1) {
    inlineByMatchNumber.set(1, deck[0]);
    footerBanners = deck.slice(1);
    return { inlineByMatchNumber, preChildrenBanners, footerBanners };
  }

  if (totalMatches === 2) {
    inlineByMatchNumber.set(1, deck[0]);
    if (deck.length >= 3) {
      inlineByMatchNumber.set(2, deck[1]);
      footerBanners = deck.slice(2);
    } else if (deck.length === 2) {
      footerBanners = [deck[1]];
    }
    return { inlineByMatchNumber, preChildrenBanners, footerBanners };
  }

  // totalMatches >= 3: spread (deck.length - 1) banners evenly at 1..totalMatches-1,
  // reserving the final banner strictly for right before <Footer />.
  const inlineCount = Math.min(totalMatches - 1, deck.length - 1);
  for (let k = 1; k <= inlineCount; k++) {
    const targetMatchNum = Math.round((k * totalMatches) / (inlineCount + 1));
    inlineByMatchNumber.set(targetMatchNum, deck[k - 1]);
  }
  footerBanners = deck.slice(inlineCount);

  return { inlineByMatchNumber, preChildrenBanners, footerBanners };
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
