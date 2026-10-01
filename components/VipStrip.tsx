"use client";

import React, { useState } from "react";
import { Crown } from "lucide-react";
import VipUpgradeModal from "@/components/VipUpgradeModal";

interface VipStripProps {
  isVip: boolean;
}

export default function VipStrip({ isVip }: VipStripProps) {
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  if (isVip) {
    return (
      <div className="w-full bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-800 text-white shadow-xs border-b border-emerald-600/30">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between">
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
        className="w-full bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 hover:from-slate-900 hover:to-slate-900 text-white border-b border-amber-400/20 transition-all duration-300 cursor-pointer group py-3 sm:py-3.5 px-4 min-h-[46px] sm:min-h-[50px] flex items-center justify-center gap-2.5 overflow-hidden"
      >
        {/* Bouncing Crown Icon Left */}
        <Crown size={16} className="text-amber-400 shrink-0 animate-bounce group-hover:scale-110 transition-transform" />

        {/* Clean Text with Increased Height and Visibility */}
        <span className="text-xs sm:text-sm md:text-[15px] font-semibold tracking-wide text-amber-300 animate-pulse group-hover:text-amber-200 transition-colors">
          Subscribe to 3-5 daily odds at $19 per week
        </span>

        {/* Bouncing Crown Icon Right */}
        <Crown size={16} className="text-amber-400 shrink-0 animate-bounce group-hover:scale-110 transition-transform" />
      </button>

      {/* VIP Upgrade Modal */}
      <VipUpgradeModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
      />
    </>
  );
}
