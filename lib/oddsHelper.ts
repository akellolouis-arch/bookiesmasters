import { AFFILIATE_PARTNERS, AffiliatePartner } from "./affiliatePartners";

export interface OneXTwoOdds {
    home: string;
    draw: string;
    away: string;
}

export function resolveOdds(
    fixtureId?: number | string | null,
    odds?: { home?: string | number | null; draw?: string | number | null; away?: string | number | null } | null,
    prediction?: string | null
): OneXTwoOdds {
    try {
        // 1. If explicit odds are provided and valid
        if (odds && odds.home && odds.draw && odds.away) {
            const numH = Number(odds.home);
            const numD = Number(odds.draw);
            const numA = Number(odds.away);
            if (!isNaN(numH) && !isNaN(numD) && !isNaN(numA)) {
                return {
                    home: numH.toFixed(2),
                    draw: numD.toFixed(2),
                    away: numA.toFixed(2),
                };
            }
        }

        // 2. Generate realistic, mathematically sound 1X2 odds deterministically
        const seed = Math.abs(Number(fixtureId) || 12345);
        const mod = seed % 100;

        let h = 2.10;
        let d = 3.25;
        let a = 3.30;

        if (prediction && typeof prediction === "string") {
            const p = prediction.toUpperCase();
            if (p === "1" || p.includes("HOME") || p === "1X") {
                h = 1.45 + (mod % 35) / 100;
                d = 3.50 + (mod % 50) / 100;
                a = 4.20 + (mod % 80) / 100;
            } else if (p === "2" || p.includes("AWAY") || p === "X2") {
                h = 3.80 + (mod % 70) / 100;
                d = 3.30 + (mod % 40) / 100;
                a = 1.65 + (mod % 45) / 100;
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
    } catch {
        return {
            home: "2.10",
            draw: "3.25",
            away: "3.30",
        };
    }
}

export function getAffiliatePartner(indexOrId?: number | string | null): AffiliatePartner {
    try {
        const partners = Array.isArray(AFFILIATE_PARTNERS) && AFFILIATE_PARTNERS.length > 0
            ? AFFILIATE_PARTNERS
            : [
                {
                    id: "1xbet",
                    name: "1XBET",
                    ctaText: "300% Bonus",
                    url: "https://reffpa.com/L?tag=d_5148910m_97c_telegram&site=5148910&ad=97&r=registration",
                    bgColor: "#1a56db",
                    textColor: "#ffffff",
                }
            ];
        const idx = Math.abs(Number(indexOrId) || 0) % partners.length;
        return partners[idx];
    } catch {
        return {
            id: "1xbet",
            name: "1XBET",
            ctaText: "300% Bonus",
            url: "https://reffpa.com/L?tag=d_5148910m_97c_telegram&site=5148910&ad=97&r=registration",
            bgColor: "#1a56db",
            textColor: "#ffffff",
        };
    }
}
