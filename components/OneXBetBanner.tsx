"use client";

import React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ONEXBET_AFFILIATE_URL } from "@/lib/affiliatePartners";

export default function OneXBetBanner() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <div className="w-full bg-[#07194f] border-b border-[#14a0ff]/70 m-0 p-0 overflow-hidden">
      <div className="w-full md:max-w-2xl lg:max-w-2xl mx-auto">
        <a
          href={ONEXBET_AFFILIATE_URL}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="group relative flex items-center justify-between w-full h-[36px] sm:h-[38px] px-2 sm:px-3 bg-[#07194f] hover:brightness-110 transition-all duration-200 cursor-pointer overflow-hidden select-none"
          title="1XBET - Register and get a 200% bonus on your first deposit"
        >
          {/* Subtle Background Graphics from 1XBET Banner */}
          <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
            <div className="absolute -left-4 top-1 w-14 h-8 bg-contain bg-no-repeat bg-[url('/banners/1xbet/bcg4.png')]" />
            <div className="absolute right-24 top-0 w-16 h-10 bg-contain bg-no-repeat bg-[url('/banners/1xbet/bcg1.png')]" />
          </div>

          {/* Left: 1XBET Logo with refined weight and subtle contrast */}
          <div className="relative z-10 flex items-center shrink-0 opacity-85 hover:opacity-100 transition-opacity">
            <div className="relative w-11 sm:w-13 md:w-15 h-3 sm:h-3.5">
              <Image
                src="/banners/1xbet/1xbet_logo.svg"
                alt="1XBET"
                fill
                priority={false}
                className="object-contain object-left"
              />
            </div>
          </div>

          {/* Center: Animated/Blinking Text with Yellowish & Whitish Capital Letters */}
          <div className="relative z-10 flex-1 min-w-0 h-[26px] flex items-center justify-center text-center px-1">
            <div className="relative w-full h-full flex items-center justify-center font-black italic uppercase tracking-tight">
              {/* Slide 1 */}
              <div className="banner-slide-1 absolute inset-0 flex items-center justify-center text-[9px] sm:text-[10px] md:text-[11px] whitespace-nowrap">
                <span className="text-[#e8c02d] drop-shadow-xs">REGISTER</span>
                <span className="text-white ml-1.5 drop-shadow-xs">AND GET A</span>
              </div>

              {/* Slide 2 */}
              <div className="banner-slide-2 absolute inset-0 flex items-center justify-center text-[9px] sm:text-[10px] md:text-[11px] whitespace-nowrap">
                <span className="text-[#e8c02d] drop-shadow-xs">200% BONUS</span>
                <span className="text-white ml-1.5 drop-shadow-xs">ON YOUR 1ST DEPOSIT</span>
              </div>
            </div>
          </div>

          {/* Right: 1XBET Lime Action Button & 18+ License Badge */}
          <div className="relative z-10 flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              className="btn-pulse flex items-center justify-center bg-[#a0cb32] hover:bg-[#b2df3a] text-[#10182a] font-black uppercase text-[8px] sm:text-[9px] md:text-[10px] px-2 sm:px-2.5 py-0.5 rounded-full border border-[#123589] shadow-[0_0_0_1px_#97bb3a] tracking-tight transition-transform"
            >
              GET BONUS
            </button>

            {/* 18+ Responsible Gaming Badge */}
            <div className="flex flex-col items-center justify-center leading-none">
              <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-white text-[#000c40] font-black text-[6.5px] sm:text-[7.5px] flex items-center justify-center shadow-xs">
                18+
              </span>
              <span className="text-[5.5px] text-gray-300 mt-0.5 font-sans font-medium hidden sm:block">
                T&amp;C apply
              </span>
            </div>
          </div>
        </a>
      </div>

      {/* Embedded Animation Styles */}
      <style jsx>{`
        .banner-slide-1 {
          animation: s1-anim 5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .banner-slide-2 {
          animation: s2-anim 5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .btn-pulse {
          animation: btn-an 5s infinite;
        }

        @keyframes s1-anim {
          0%, 47% {
            opacity: 1;
            transform: translateY(0);
            visibility: visible;
          }
          50%, 97% {
            opacity: 0;
            transform: translateY(-14px);
            visibility: hidden;
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            visibility: visible;
          }
        }

        @keyframes s2-anim {
          0%, 47% {
            opacity: 0;
            transform: translateY(14px);
            visibility: hidden;
          }
          50%, 97% {
            opacity: 1;
            transform: translateY(0);
            visibility: visible;
          }
          100% {
            opacity: 0;
            transform: translateY(14px);
            visibility: hidden;
          }
        }

        @keyframes btn-an {
          0%, 20%, 24%, 28%, 70%, 74%, 78%, 100% {
            transform: scale(1);
          }
          22%, 26%, 72%, 76% {
            transform: scale(0.91);
          }
        }
      `}</style>
    </div>
  );
}
