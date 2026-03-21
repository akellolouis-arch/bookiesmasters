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

/** 9 days: Kenya today −6 … +2. Same logic on server + client → no empty strip before dates. */
function buildKenyaDateStrip(): Date[] {
  const todayYmd = kenyaYmdFormatter.format(new Date());
  const [y0, m0, d0] = todayYmd.split("-").map(Number);
  const out: Date[] = [];
  for (let i = -6; i <= 2; i++) {
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
      <div className="max-w-3xl mx-auto flex items-center gap-1 md:gap-3 px-2 py-1.5 min-w-0">

        <Link
          href="/live"
          className={`shrink-0 w-12 h-8 rounded-md flex flex-col items-center justify-center text-[9px] font-bold transition-colors border ${isLivePage
            ? "bg-white/20 border-transparent text-white shadow-lg shadow-white/10"
            : "bg-[#1F1F1F] border-white/5 text-gray-400 hover:text-white"
            }`}
        >
          LIVE
        </Link>

        <div
          ref={scrollContainerRef}
          className="flex-1 min-w-0 overflow-x-auto flex items-center gap-1.5 scrollbar-hide no-scrollbar px-1 min-h-8"
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
                className={`shrink-0 flex flex-col items-center justify-center w-[45px] h-8 rounded-md border transition-all ${isActive
                  ? "bg-white/20 border-transparent text-white shadow-lg shadow-white/10"
                  : "bg-[#1F1F1F] border-white/5 text-gray-500 hover:bg-[#252525] hover:text-gray-300"
                  }`}
              >
                <span className="text-[9px] font-bold uppercase leading-tight">{dayName}</span>
                <span className="text-[9px] font-medium leading-tight opacity-90">{dateStr}</span>
              </button>
            );
          })}
        </div>

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
