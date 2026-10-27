"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Application error:", error);
    }, [error]);

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-xs">
                <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
                Something went wrong
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mb-6 leading-relaxed">
                An unexpected error occurred while loading this page. Please try refreshing or return to the homepage.
            </p>
            <div className="flex items-center gap-3">
                <button
                    onClick={() => reset()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                    <RefreshCw size={14} />
                    <span>Try again</span>
                </button>
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold border border-gray-300 transition-colors"
                >
                    <Home size={14} />
                    <span>Go Home</span>
                </Link>
            </div>
        </div>
    );
}

