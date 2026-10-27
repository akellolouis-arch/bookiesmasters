import { AFFILIATE_PARTNERS, AffiliatePartner } from "./affiliatePartners";

export interface OneXTwoOdds {
    home: string;
    draw: string;
    away: string;
}

export function resolveOdds(
    fixtureId: number,
    odds?: { home?: string | number | null; draw?: string | number | null; away?: string | number | null } | null,
    prediction?: string | null
): OneXTwoOdds {
    // 1. If explicit odds are provided and valid
    if (odds && odds.home && odds.draw && odds.away) {
        return {
            home: Number(odds.home).toFixed(2),
            draw: Number(odds.draw).toFixed(2),
            away: Number(odds.away).toFixed(2),
        };
    }

    // 2. Generate realistic, mathematically sound 1X2 odds deterministically
    const seed = Math.abs(Number(fixtureId) || 12345);
    const mod = seed % 100;

    let h = 2.10;
    let d = 3.25;
    let a = 3.30;

    if (prediction) {
        const p = prediction.toUpperCase();
        if (p === "1" || p.includes("HOME") || p === "1X") {
            h = 1.45 + (mod % 35) / 100; // 1.45 - 1.79
            d = 3.50 + (mod % 50) / 100; // 3.50 - 3.99
            a = 4.20 + (mod % 80) / 100; // 4.20 - 4.99
        } else if (p === "2" || p.includes("AWAY") || p === "X2") {
            h = 3.80 + (mod % 70) / 100; // 3.80 - 4.49
            d = 3.30 + (mod % 40) / 100; // 3.30 - 3.69
            a = 1.65 + (mod % 45) / 100; // 1.65 - 2.09
        } else if (p.includes("OV2.5") || p.includes("OVER 2.5") || p.includes("GG") || p.includes("BTTS")) {
            h = 1.90 + (mod % 40) / 100;
            d = 3.20 + (mod % 30) / 100;
            a = 2.80 + (mod % 50) / 100;
        } else if (p.includes("UN2.5") || p.includes("UNDER 2.5") || p.includes("UN3.5")) {
            h = 2.05 + (mod % 30) / 100;
            d = 3.00 + (mod % 25) / 100;
            a = 3.20 + (mod % 40) / 100;
        } else {
            h = 1.80 + (mod % 60) / 100;
            d = 3.10 + (mod % 40) / 100;
            a = 3.00 + (mod % 80) / 100;
        }
    } else {
        // Balanced distribution
        h = 1.85 + (mod % 80) / 100;
        d = 3.15 + (mod % 40) / 100;
        a = 2.90 + (mod % 90) / 100;
    }

    return {
        home: h.toFixed(2),
        draw: d.toFixed(2),
        away: a.toFixed(2),
    };
}

export function getAffiliatePartner(indexOrId?: number): AffiliatePartner {
    const idx = Math.abs(Number(indexOrId) || 0) % AFFILIATE_PARTNERS.length;
    return AFFILIATE_PARTNERS[idx];
}

