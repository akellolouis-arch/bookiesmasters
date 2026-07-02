"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Props {
  date: string; // yyyy-mm-dd from page params
}

const KENYA_TZ = "Africa/Nairobi";

const kenyaYmdFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: KENYA_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** 7 days: Kenya today −5 … +1. */
function buildKenyaDateStrip(): Date[] {
  const todayYmd = kenyaYmdFormatter.format(new Date());
  const [y0, m0, d0] = todayYmd.split("-").map(Number);
  const out: Date[] = [];
  for (let i = -5; i <= 1; i++) {
    const ms = Date.UTC(y0, m0 - 1, d0 + i);
    out.push(new Date(ms));
  }
  return out;
}

function toYYYYMMDDUtc(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function DateNavigator({ date }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isLivePage = pathname === "/live";
  const initialQuery = searchParams.get("q") || "";
  const [isSearchOpen, setIsSearchOpen] = useState(Boolean(initialQuery));
  const [searchText, setSearchText] = useState(initialQuery);

  const selectedYmd = date;

  const [dates] = useState(() => buildKenyaDateStrip());

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


  const handleDateClick = (d: Date) => {
    const nextDate = toYYYYMMDDUtc(d);
    const q = (searchParams.get("q") || "").trim();
    const baseRoute = "/predictions";
    const url = q ? `${baseRoute}/${nextDate}?q=${encodeURIComponent(q)}` : `${baseRoute}/${nextDate}`;
    router.push(url);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchText.trim();
    const baseRoute = "/predictions";
    const basePath = isLivePage ? "/live" : `${baseRoute}/${date}`;
    const url = trimmed ? `${basePath}?q=${encodeURIComponent(trimmed)}` : basePath;
    router.push(url);
  };

  const clearSearch = () => {
    setSearchText("");
    const baseRoute = "/predictions";
    const basePath = isLivePage ? "/live" : `${baseRoute}/${date}`;
    router.push(basePath);
  };

  return (
    <div className="max-w-[100vw] bg-gray-50 border-y border-gray-200 mx-auto">
      <div className="max-w-3xl mx-auto w-full">
        <div className="flex items-stretch w-full h-8 overflow-hidden bg-gray-50 divide-x divide-white/5 shadow-sm">

          <Link
            href="/live"
            className="shrink-0 w-10 flex flex-col items-center justify-center text-[10px] font-bold transition-colors text-gray-900 bg-white hover:bg-[#2F2F2F]"
          >
            LIVE
          </Link>

          <div
            ref={scrollContainerRef}
            className="flex-1 min-w-0 overflow-x-auto flex items-stretch scrollbar-hide no-scrollbar divide-x divide-white/5"
          >
            {dates.map((d, i) => {
              const isActive = toYYYYMMDDUtc(d) === selectedYmd;
              const dayName = d.toLocaleDateString("en-GB", {
                weekday: "short",
                timeZone: KENYA_TZ,
              });
              const dateStr = d.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                timeZone: KENYA_TZ,
              });

              return (
                <button
                  type="button"
                  key={`${toYYYYMMDDUtc(d)}-${i}`}
                  onClick={() => handleDateClick(d)}
                  data-active={isActive}
                  className={`flex-1 flex flex-col items-center justify-center min-w-[40px] transition-all ${isActive
                    ? "bg-gray-300 text-blue-800 shadow-inner"
                    : "text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                    }`}
                >
                  <span className="text-[10px] font-bold uppercase leading-tight">{dayName}</span>
                  <span className="text-[10px] font-bold leading-tight opacity-90">{dateStr}</span>
                </button>
              );
            })}
          </div>

          {isSearchOpen ? (
            <form onSubmit={handleSearchSubmit} className="shrink-0 flex items-stretch divide-x divide-white/5 bg-white">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Team"
                className="w-24 sm:w-28 bg-transparent text-gray-900 text-xs px-2 outline-none"
              />
              <button
                type="submit"
                className="w-9 flex items-center justify-center text-gray-900 hover:bg-[#2F2F2F] transition-colors"
                aria-label="Search fixtures"
              >
                <Search size={14} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={() => {
                  clearSearch();
                  setIsSearchOpen(false);
                }}
                className="w-9 flex items-center justify-center text-gray-700 hover:bg-[#2F2F2F] transition-colors text-xs font-bold"
                aria-label="Close search"
              >
                ×
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="shrink-0 w-10 flex items-center justify-center text-gray-900 hover:bg-[#2F2F2F] transition-colors bg-white"
              aria-label="Open fixture search"
            >
              <Search size={14} strokeWidth={2.5} />
            </button>
          )}

        </div>
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
