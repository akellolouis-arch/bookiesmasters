"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Props {
  date: string; // yyyy-mm-dd from page params
}

export default function DateNavigator({ date }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isLivePage = pathname === "/live";
  const initialQuery = searchParams.get("q") || "";
  const [isSearchOpen, setIsSearchOpen] = useState(Boolean(initialQuery));
  const [searchText, setSearchText] = useState(initialQuery);

  // Parse selected date from URL (yyyy-mm-dd)
  const [year, month, day] = date.split("-").map(Number);
  const currentDate = new Date(year, month - 1, day);

  /**
   * Build the scroll row only on the client. Using `new Date()` for "today" during SSR
   * vs hydration (different TZ / midnight) caused hydration mismatches and broke click
   * handling for date buttons and sometimes list items below.
   */
  const [dates, setDates] = useState<Date[]>([]);
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next: Date[] = [];
    for (let i = -6; i <= 2; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      next.push(d);
    }
    setDates(next);
  }, []);

  // Scroll active date into view on mount / when strip is ready
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollContainerRef.current && dates.length > 0) {
      const activeEl = scrollContainerRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "auto", block: "nearest", inline: "center" });
      }
    }
  }, [date, dates.length]);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setSearchText(q);
    setIsSearchOpen(Boolean(q));
  }, [searchParams]);


  // Helper to format YYYY-MM-DD
  const toYYYYMMDD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const handleDateClick = (d: Date) => {
    const nextDate = toYYYYMMDD(d);
    const q = (searchParams.get("q") || "").trim();
    const url = q ? `/predictions/${nextDate}?q=${encodeURIComponent(q)}` : `/predictions/${nextDate}`;
    router.push(url);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchText.trim();
    const basePath = isLivePage ? "/live" : `/predictions/${date}`;
    const url = trimmed ? `${basePath}?q=${encodeURIComponent(trimmed)}` : basePath;
    router.push(url);
  };

  const clearSearch = () => {
    setSearchText("");
    const basePath = isLivePage ? "/live" : `/predictions/${date}`;
    router.push(basePath);
  };

  return (
    <div className="max-w-[100vw] bg-black border-y border-white/5 mx-auto">
      <div className="max-w-3xl mx-auto flex items-center gap-1 md:gap-3 px-2 py-1.5">

        {/* LEFT: LIVE button */}
        <Link
          href="/live"
          className={`shrink-0 w-12 h-8 rounded-md flex flex-col items-center justify-center text-[9px] font-bold transition-colors border ${isLivePage
            ? "bg-white/20 border-transparent text-white shadow-lg shadow-white/10"
            : "bg-[#1F1F1F] border-white/5 text-gray-400 hover:text-white"
            }`}
        >
          LIVE
        </Link>

        {/* CENTER: SCROLLABLE DATES */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto flex items-center gap-1.5 scrollbar-hide no-scrollbar px-1 min-h-8"
        >
          {dates.length === 0 ? (
            <div className="flex-1 flex items-center gap-1.5 px-1 opacity-40">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="shrink-0 w-[45px] h-8 rounded-md bg-[#1F1F1F] border border-white/5" />
              ))}
            </div>
          ) : (
            dates.map((d, i) => {
              const isActive = d.toDateString() === currentDate.toDateString();
              const dayName = d.toLocaleDateString("en-GB", { weekday: "short" });
              const dateStr = d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" });

              return (
                <button
                  type="button"
                  key={`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${i}`}
                  onClick={() => handleDateClick(d)}
                  data-active={isActive}
                  className={`shrink-0 flex flex-col items-center justify-center w-[45px] h-8 rounded-md border transition-all ${isActive
                    ? "bg-white/20 border-transparent text-white shadow-lg shadow-white/10"
                    : "bg-[#1F1F1F] border-white/5 text-gray-500 hover:bg-[#252525] hover:text-gray-300"
                    }`}
                >
                  <span className="text-[9px] font-bold uppercase leading-tight">{dayName}</span>
                  <span className="text-[9px] font-medium leading-tight opacity-90">{dateStr}</span>
                </button>
              );
            })
          )}
        </div>

        {/* RIGHT: Search button/input */}
        {isSearchOpen ? (
          <form onSubmit={handleSearchSubmit} className="shrink-0 flex items-center gap-1">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Team"
              className="w-28 h-8 bg-[#1F1F1F] text-white text-xs px-2 rounded-md border border-white/10 outline-none focus:border-white/10"
            />
            <button
              type="submit"
              className="w-8 h-8 bg-[#1F1F1F] text-white rounded-md border border-white/5 flex items-center justify-center hover:bg-[#2F2F2F] transition-colors"
              aria-label="Search fixtures"
            >
              <Search size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                clearSearch();
                setIsSearchOpen(false);
              }}
              className="w-8 h-8 bg-[#1F1F1F] text-gray-300 rounded-md border border-white/5 flex items-center justify-center hover:bg-[#2F2F2F] transition-colors text-xs font-bold"
              aria-label="Close search"
            >
              ×
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="shrink-0 w-8 h-8 bg-[#1F1F1F] text-white rounded-md border border-white/5 flex items-center justify-center hover:bg-[#2F2F2F] transition-colors"
            aria-label="Open fixture search"
          >
            <Search size={14} />
          </button>
        )}
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
