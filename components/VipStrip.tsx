"use client";

import React, { useState } from "react";
import { Crown } from "lucide-react";
import PaystackCheckout from "@/components/PaystackCheckout";

interface VipStripProps {
  isVip: boolean;
}

export default function VipStrip({ isVip }: VipStripProps) {
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  if (isVip) {
    return (
      <div className="w-full bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-800 text-white shadow-xs border-b border-emerald-600/30">
        <div className="max-w-7xl mx-auto px-4 py-1 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Crown size={14} className="text-amber-300 animate-bounce" />
            <span>VIP PASS ACTIVE — Full Access Unlocked</span>
          </div>
          <span className="text-[10px] bg-emerald-900/60 border border-emerald-400/40 text-emerald-200 font-bold px-2 py-0.5 rounded-full uppercase">
            VIP Member
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Clickable Single-Row Animated Advert Strip */}
      <button
        type="button"
        onClick={() => setShowCheckoutModal(true)}
        className="w-full bg-gradient-to-r from-teal-950 via-emerald-900 to-teal-950 hover:from-teal-900 hover:via-emerald-800 hover:to-teal-900 text-white shadow-md border-b border-amber-400/40 transition-all duration-300 cursor-pointer group py-1.5 px-3 flex items-center justify-center gap-2.5 overflow-hidden relative"
      >
        {/* Pulsing subtle background glow wave */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent animate-pulse pointer-events-none" />

        {/* Bouncing Crown Icon Left */}
        <Crown size={15} className="text-amber-400 shrink-0 animate-bounce group-hover:scale-125 transition-transform" />

        {/* Glowing Pulsingenticing Text */}
        <span className="text-xs sm:text-sm font-black tracking-wide text-amber-300 animate-pulse group-hover:text-white transition-colors drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]">
          Subscribe for 3-5 daily odds at $19 per week
        </span>

        {/* Bouncing Crown Icon Right */}
        <Crown size={15} className="text-amber-400 shrink-0 animate-bounce group-hover:scale-125 transition-transform" />
      </button>

      {/* Paystack Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xl w-full max-w-md relative text-center">
            <button
              onClick={() => setShowCheckoutModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-sm font-bold"
            >
              ✕
            </button>
            <div className="inline-flex p-3 rounded-full bg-amber-100 text-amber-600 mb-3">
              <Crown size={28} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-1">Activate 7-Day VIP Pass</h3>
            <p className="text-xs text-gray-600 mb-6">
              Get 3-5 daily odds at $19 per week with full unlocked access.
            </p>

            <PaystackCheckout amount={2500} currency="KES" displayText="Pay $19 to Unlock VIP" />
          </div>
        </div>
      )}
    </>
  );
}
