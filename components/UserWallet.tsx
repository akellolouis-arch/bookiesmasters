"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Wallet } from "lucide-react";

export default function UserWallet() {
    const { data: session } = useSession();
    const [credits, setCredits] = useState<number | null>(null);

    useEffect(() => {
        if (session?.user) {
            fetchBalance();
        }
    }, [session]);

    const fetchBalance = async () => {
        try {
            const res = await fetch("/api/user/balance");
            if (res.ok) {
                const data = await res.json();
                console.log("Balance fetched:", data); // Debug
                setCredits(data.credits);
            } else {
                const errText = await res.text();
                console.error("Balance fetch failed:", res.status, errText);
            }
        } catch (error) {
            console.error("Failed to fetch balance", error);
        }
    };

    if (!session) return null;

    return (
        <Link
            href="/predictions"
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-full border border-yellow-500/30 transition text-sm"
        >
            <Wallet className="w-4 h-4 text-yellow-500" />
            <span className="font-medium text-yellow-500">
                {credits !== null ? `${credits} CR` : "..."}
            </span>
        </Link>
    );
}
