export interface AffiliatePartner {
  id: string;
  name: string;
  ctaText: string;
  url: string;
  bgColor: string;
  textColor: string;
}

export const PARIPESA_AFFILIATE_URL =
  process.env.NEXT_PUBLIC_PARIPESA_AFFILIATE_URL ||
  process.env.NEXT_PUBLIC_PARIPESA_URL ||
  "https://paripesa.bet/registration/?tag=BKMS254";

export const AFFILIATE_PARTNERS: AffiliatePartner[] = [
  {
    id: "paripesa",
    name: "PARIPESA",
    ctaText: "Bonus BKMS254",
    url: PARIPESA_AFFILIATE_URL,
    bgColor: "#0f52ba", // Paripesa Blue
    textColor: "#ffffff",
  },
  {
    id: "1xbet",
    name: "1XBET",
    ctaText: "300% Bonus",
    url: "https://reffpa.com/L?tag=d_5148910m_97c_telegram&site=5148910&ad=97&r=registration",
    bgColor: "#1a56db", // 1xBet Blue
    textColor: "#ffffff",
  },
  {
    id: "melbet",
    name: "MELBET",
    ctaText: "200% Bonus",
    url: "https://refpa3665.com/L?tag=d_2790675m_45415c_&site=2790675&ad=45415",
    bgColor: "#f59e0b", // Melbet Amber/Gold
    textColor: "#000000",
  },
];
