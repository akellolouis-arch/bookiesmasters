"use client";

import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

interface Props {
  date: string; // yyyy-mm-dd from page params
}

export default function DateNavigator({ date }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const isLivePage = pathname === "/live";

  // Parse current date
  const [year, month, day] = date.split("-").map(Number);
  const currentDate = new Date(year, month - 1, day); // Local midnight

  // Fixed reference to Today (Client Time) to prevent window shifting
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate fixed range: 14 days total (-6 to +7)
  const dates = [];
  for (let i = -6; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }

  // Scroll active date into view on mount
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollContainerRef.current) {
      // Find the active element
      const activeEl = scrollContainerRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "instant", block: "nearest", inline: "center" });
      }
    }
  }, [date]);


  // Helper to format YYYY-MM-DD
  const toYYYYMMDD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const handleDateClick = (d: Date) => {
    router.push(`/predictions/${toYYYYMMDD(d)}`);
  };

  return (
    <div className="max-w-[100vw] bg-black border-y border-white/5 mx-auto">
      <div className="max-w-3xl mx-auto flex items-center gap-1 md:gap-3 px-2 py-1.5">

        {/* LEFT: LIVE button */}
        <Link
          href="/live"
          className={`shrink-0 w-12 h-8 rounded-md flex flex-col items-center justify-center text-[9px] font-bold transition-colors border ${isLivePage
            ? "bg-red-600/10 border-red-600 text-red-500 animate-pulse"
            : "bg-[#1F1F1F] border-white/5 text-gray-400 hover:text-white"
            }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current mb-0.5 animate-pulse" />
          LIVE
        </Link>

        {/* CENTER: SCROLLABLE DATES */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto flex items-center gap-1.5 pb-2"
        >
          {dates.map((d, i) => {
            const isToday = new Date().toDateString() === d.toDateString();
            const isActive = d.toDateString() === currentDate.toDateString();
            const dayName = d.toLocaleDateString("en-GB", { weekday: "short" }); // e.g. Fri
            const dateStr = d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" }); // e.g. 16/01

            return (
              <button
                key={i}
                onClick={() => handleDateClick(d)}
                data-active={isActive}
                className={`shrink-0 flex flex-col items-center justify-center w-[45px] h-8 rounded-md border transition-all ${isActive
                  ? "bg-[#63FF79] border-[#63FF79] text-black shadow-lg shadow-[#63FF79]/20"
                  : isToday
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-[#1F1F1F] border-white/5 text-gray-500 hover:bg-[#252525] hover:text-gray-300"
                  }`}
              >
                <span className="text-[9px] font-bold uppercase leading-tight">{dayName}</span>
                <span className="text-[9px] font-medium leading-tight opacity-90">{dateStr}</span>
              </button>
            );
          })}
        </div>

        {/* RIGHT: Search button */}
        <button
          className="shrink-0 w-8 h-8 bg-[#1F1F1F] text-white rounded-md border border-white/5 flex items-center justify-center hover:bg-[#2F2F2F] transition-colors"
        >
          <Search size={14} />
        </button>
      </div>
    </div>
  );
}
