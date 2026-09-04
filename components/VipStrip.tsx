"use client";

import React, { useState } from "react";
import { Crown, ArrowRight } from "lucide-react";
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
      {/* Clickable Single-Row Advert Strip */}
      <button
        type="button"
        onClick={() => setShowCheckoutModal(true)}
        className="w-full bg-gradient-to-r from-teal-950 via-emerald-900 to-teal-950 hover:from-teal-900 hover:via-emerald-800 hover:to-teal-900 text-white shadow-sm border-b border-amber-400/30 transition-all duration-300 cursor-pointer group py-1.5 px-3 flex items-center justify-center gap-2"
      >
        <Crown size={14} className="text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
        <span className="text-xs sm:text-sm font-extrabold tracking-wide text-amber-300 group-hover:text-amber-200 transition-colors">
          Subscribe to 3-5 daily odds at $19 per week
        </span>
        <span className="bg-amber-400/20 text-amber-300 group-hover:bg-amber-400 group-hover:text-slate-950 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all">
          <span>Click Here</span>
          <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
        </span>
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
