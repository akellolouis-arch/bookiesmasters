"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Sparkles, Calendar } from "lucide-react";

function BottomNavTabsContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (pathname?.startsWith("/admin")) return null;

  // Check active section
  const isFixtures = pathname?.startsWith("/fixtures");
  const isPredictions = pathname?.startsWith("/predictions") || pathname === "/";

  // Extract selected date from pathname if available
  let selectedDate = "";
  const dateMatch = pathname?.match(/\/(?:predictions|fixtures)\/([^\/?#]+)/);
  if (dateMatch && dateMatch[1]) {
    selectedDate = dateMatch[1];
  }

  // Fallback to today in Kenya timezone
  if (!selectedDate) {
    selectedDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Nairobi",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }

  const query = searchParams?.get("q");
  const queryString = query ? `?q=${encodeURIComponent(query)}` : "";

  const predictionsUrl = `/predictions/${selectedDate}${queryString}`;
  const fixturesUrl = `/fixtures/${selectedDate}${queryString}`;

  return (
    <div className="w-full max-w-md mx-auto mt-1 mb-2.5 px-2 flex justify-center">
      <div className="inline-flex p-1 bg-gray-200/90 rounded-2xl shadow-inner w-full sm:w-auto">
        {/* Predictions Tab */}
        <Link
          href={predictionsUrl}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
            isPredictions && !isFixtures
              ? "bg-teal-700 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
          title="View expert predictions and confidence tips"
        >
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          <span>Predictions</span>
        </Link>

        {/* Fixtures Tab */}
        <Link
          href={fixturesUrl}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
            isFixtures
              ? "bg-teal-700 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
          title="View all matches and fixtures"
        >
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span>Fixtures</span>
        </Link>
      </div>
    </div>
  );
}

export default function BottomNavTabs() {
  return (
    <Suspense fallback={<div className="h-10 w-full" />}>
      <BottomNavTabsContent />
    </Suspense>
  );
}
