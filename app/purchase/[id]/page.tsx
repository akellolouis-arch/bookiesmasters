"use client";

import React, { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { Loader2, ArrowLeft, Send } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

interface FixtureDetails {
    fixtureId: number;
    homeTeam: { name: string; logo: string };
    awayTeam: { name: string; logo: string };
    date: string;
    creditCost: number;
}

export default function PurchasePage() {
    const { id } = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();

    const [fixture, setFixture] = useState<FixtureDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [amount, setAmount] = useState("");
    const [code, setCode] = useState("");

    // Auto-login if landing here without session (redundant safe-guard)
    useEffect(() => {
        if (status === "unauthenticated") {
            signIn("google", { callbackUrl: `/purchase/${id}` });
        }
    }, [status, id]);

    // Fetch Fixture
    useEffect(() => {
        if (!id) return;
        const fetchFixture = async () => {
            console.log("DEBUG: Fetching fixture for ID:", id);
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                const res = await fetch(`${baseUrl}/api/fixtures/${id}`);
                const data = await res.json();
                console.log("DEBUG: Fixture Fetch Response:", data);
                if (data.success) {
                    setFixture(data.data);
                    setAmount(String(data.data.creditCost || 500));
                } else {
                    console.error("DEBUG: Fetch success false:", data.message);
                }
            } catch (err) {
                console.error("DEBUG: Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFixture();
    }, [id]);

    if (status === "loading" || loading || !session) {
        return <div className="min-h-screen bg-[#121212] flex items-center justify-center"><Loader2 className="animate-spin text-yellow-500 w-10 h-10" /></div>;
    }

    if (!fixture) {
        return <div className="text-white text-center mt-20">Fixture not found.</div>;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const res = await fetch(`${baseUrl}/api/payment/request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: session.user?.email,
                    amount: Number(amount),
                    mpesaCode: code,
                    fixtureId: fixture.fixtureId
                })
            });
            const data = await res.json();

            if (res.ok) {
                alert("Payment Submitted! Pending verification.");
                router.push("/predictions");
            } else {
                alert(data.error || "Failed");
            }
        } catch (err) {
            alert("Error submitting payment");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#121212] p-4 text-white font-sans">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="max-w-md mx-auto">
                {/* Header Match Info */}
                <div className="text-center mb-8">
                    <h1 className="text-xl font-bold mb-4 text-yellow-500">Unlock Prediction</h1>
                    <div className="flex items-center justify-center gap-6 bg-[#1e1e1e] p-6 rounded-2xl border border-white/10 shadow-lg">
                        <div className="flex flex-col items-center w-1/3">
                            <div className="relative w-12 h-12 mb-2">
                                <Image src={fixture.homeTeam.logo} fill className="object-contain" alt="Home" />
                            </div>
                            <span className="text-xs font-bold text-center leading-tight">{fixture.homeTeam.name}</span>
                        </div>
                        <span className="text-gray-500 font-black text-xl">VS</span>
                        <div className="flex flex-col items-center w-1/3">
                            <div className="relative w-12 h-12 mb-2">
                                <Image src={fixture.awayTeam.logo} fill className="object-contain" alt="Away" />
                            </div>
                            <span className="text-xs font-bold text-center leading-tight">{fixture.awayTeam.name}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Card */}
                <div className="bg-[#1e1e1e] border border-green-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-emerald-400 to-green-500"></div>

                    <div className="mb-8 text-center">
                        <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">To Reveal Prediction</p>
                        <div className="text-4xl font-black text-white flex items-center justify-center gap-1">
                            <span className="text-green-500 text-2xl">KSH</span> {fixture.creditCost || 500}
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
                        <p className="font-bold text-gray-300 text-sm mb-3 border-b border-white/10 pb-2">Payment Instructions:</p>
                        <ol className="list-decimal list-outside ml-4 space-y-3 text-sm text-gray-400">
                            <li>Go to M-Pesa Menu & Select <strong>Send Money</strong>.</li>
                            <li>Enter Number: <span className="font-mono font-bold text-white bg-green-900/40 px-2 py-0.5 rounded border border-green-500/20 select-all">+254 745 676 267</span></li>
                            <li>Enter Amount: <strong className="text-white">KSH {fixture.creditCost || 500}</strong></li>
                            <li>Enter the <strong>Transaction Code</strong> below.</li>
                        </ol>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="relative">
                            <label className="text-[10px] text-gray-500 uppercase font-bold absolute -top-2 left-3 bg-[#1e1e1e] px-1">M-Pesa Transaction Code</label>
                            <input
                                type="text"
                                value={code}
                                onChange={e => setCode(e.target.value.toUpperCase())}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-mono placeholder:text-gray-700 focus:border-green-500 outline-none transition uppercase text-center tracking-widest text-lg"
                                placeholder="QWE123..."
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-green-600 hover:bg-green-500 active:scale-95 text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
                        >
                            {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : <> <Send className="w-5 h-5" /> I Have Paid </>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
