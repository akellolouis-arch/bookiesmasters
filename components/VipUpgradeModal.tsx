"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import logo from "@/public/bookiesmasters_text_v2.png";
import PaystackCheckout from "@/components/PaystackCheckout";

interface VipUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VipUpgradeModal({ isOpen, onClose }: VipUpgradeModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-xl w-full max-w-xs sm:max-w-sm relative flex flex-col items-center text-center transform transition-all scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        <div className="flex justify-center mb-3 mt-1">
          <Image
            src={logo}
            alt="BookiesMasters Logo"
            className="h-6 w-auto object-contain skew-x-[12deg] origin-center"
            priority
          />
        </div>

        <p className="text-xs sm:text-sm font-semibold text-gray-800 mb-4 max-w-xs leading-relaxed">
          get 3-5 daily curated odds at $19 per week
        </p>

        <div className="w-full">
          <PaystackCheckout
            amount={2500}
            currency="KES"
            displayText="activate one week pro pass"
            variant="white"
          />
        </div>
      </div>
    </div>
  );
}

