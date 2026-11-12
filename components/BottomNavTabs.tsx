"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

function BottomNavTabsContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (pathname?.startsWith("/admin")) return null;

  // Check active section
  const isFixtures = pathname?.startsWith("/fixtures");
  const isPredictions = pathname?.startsWith("/predictions") || pathname === "/" || pathname === "/live";

  // Extract selected date from pathname if available
  let selectedDate = "";
  const dateMatch = pathname?.match(/\/(?:predictions|fixtures)\/([^\/?#]+)/);
  if (dateMatch && dateMatch[1]) {
    selectedDate = dateMatch[1];
  } else if (pathname === "/live" || pathname === "/fixtures/live") {
    selectedDate = "live";
  }

  // Fallback to today in Kenya timezone if empty
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

  const predictionsUrl = selectedDate === "live" ? `/live${queryString}` : `/predictions/${selectedDate}${queryString}`;
  const fixturesUrl = selectedDate === "live" ? `/fixtures/live${queryString}` : `/fixtures/${selectedDate}${queryString}`;

  return (
    <div className="w-full bg-gray-100 border-b border-gray-200 m-0 p-0">
      <div className="w-full md:max-w-2xl lg:max-w-2xl mx-auto py-0.5 px-1 sm:px-2">
        <div className="grid grid-cols-2 gap-1.5 w-full">
          {/* Predictions Tab */}
          <Link
            href={predictionsUrl}
            className={`flex items-center justify-center py-1 text-xs font-medium tracking-wide rounded transition-all ${
              isPredictions && !isFixtures
                ? "bg-gray-300 text-teal-700 shadow-inner"
                : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 border border-gray-200"
            }`}
            title="View expert predictions and confidence tips"
          >
            <span>Predictions</span>
          </Link>

          {/* Fixtures Tab */}
          <Link
            href={fixturesUrl}
            className={`flex items-center justify-center py-1 text-xs font-medium tracking-wide rounded transition-all ${
              isFixtures
                ? "bg-gray-300 text-teal-700 shadow-inner"
                : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 border border-gray-200"
            }`}
            title="View all matches and fixtures"
          >
            <span>Fixtures</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BottomNavTabs() {
  return (
    <Suspense fallback={<div className="h-10 w-full bg-gray-100" />}>
      <BottomNavTabsContent />
    </Suspense>
  );
}
