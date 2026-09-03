"use client";

import React, { useState } from "react";
import { Crown, Sparkles, Lock, ArrowRight } from "lucide-react";
import PaystackCheckout from "@/components/PaystackCheckout";

interface VipStripProps {
  isVip: boolean;
}

export default function VipStrip({ isVip }: VipStripProps) {
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  if (isVip) {
    return (
      <div className="w-full bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-800 text-white shadow-sm border-b border-emerald-600/30">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Crown size={16} className="text-amber-300 animate-bounce" />
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
      <div className="w-full bg-gradient-to-r from-teal-900 via-emerald-900 to-teal-950 text-white shadow-md border-b border-teal-700/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
              <Crown size={20} className="text-amber-400" />
            </div>
            <div>
              <div className="text-sm font-black flex items-center justify-center sm:justify-start gap-1.5 text-amber-300">
                Unlock Premium Predictions <Sparkles size={14} />
              </div>
              <p className="text-xs text-teal-200/90 font-medium">
                Subscribe to VIP to instantly unlock Today & Tomorrow&apos;s predictions.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCheckoutModal(true)}
            className="shrink-0 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2"
          >
            <span>SUBSCRIBE TO VIP ($19 / wk)</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xl w-full max-w-md relative">
            <button
              onClick={() => setShowCheckoutModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-sm font-bold"
            >
              ✕
            </button>
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-full bg-amber-100 text-amber-600 mb-3">
                <Crown size={28} />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-1">Activate 7-Day VIP Pass</h3>
              <p className="text-xs text-gray-600">
                Get full unlocked access to all Admin-curated match tips & odds.
              </p>
            </div>

            <PaystackCheckout amount={2500} currency="KES" displayText="Pay $19 to Unlock VIP" />
          </div>
        </div>
      )}
    </>
  );
}
