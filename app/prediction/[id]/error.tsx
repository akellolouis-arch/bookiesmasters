"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";

export default function FixtureError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Fixture details error:", error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 mb-4 shadow-xs">
                <AlertCircle size={28} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
                Unable to load match details
            </h2>
            <p className="text-xs text-gray-500 max-w-md mb-6 leading-relaxed">
                The match details couldn't be loaded at this moment. This might be due to a brief network interruption or server update.
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
                    <ArrowLeft size={14} />
                    <span>Back to matches</span>
                </Link>
            </div>
        </div>
    );
}

