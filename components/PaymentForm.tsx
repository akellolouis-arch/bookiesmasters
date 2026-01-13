"use client";

import React, { useState, useEffect } from "react";
import { Loader2, CheckCircle, Send, XCircle, Clock } from "lucide-react";

interface PaymentFormProps {
    email: string;
}

interface PaymentRequest {
    _id: string;
    amount: number;
    mpesaCode: string;
    status: "pending" | "approved" | "rejected";
    adminNote?: string;
    date: string;
}

export default function PaymentForm({ email }: PaymentFormProps) {
    const [amount, setAmount] = useState("");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [history, setHistory] = useState<PaymentRequest[]>([]);

    // Load History
    const fetchHistory = async () => {
        setRefreshing(true);
        // Note: We need an endpoint for user to see OWN requests.
        // Current API `getPendingRequests` is for Admin.
        // I should probably add `access user's history` or just save locally?
        // Let's implement client-side fetch if endpoint exists, or skip history for now?
        // Actually, let's skip history fetch for this iteration OR filter local storage?
        // Better: Just show success message.
        setRefreshing(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const res = await fetch(`${baseUrl}/api/payment/request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, amount: Number(amount), mpesaCode: code })
            });

            const data = await res.json();

            if (res.ok) {
                alert("Payment submitted! We will verify it shortly.");
                setAmount("");
                setCode("");
            } else {
                alert(data.error || "Submission failed");
            }

        } catch (err) {
            console.error(err);
            alert("Connection error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Send className="w-5 h-5 text-green-500" />
                    Buy Credits via M-Pesa
                </h3>

                <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-4 mb-6 text-sm text-green-200">
                    <p className="font-bold mb-1">Instructions:</p>
                    <ol className="list-decimal list-inside space-y-1">
                        <li>Go to M-Pesa Menu</li>
                        <li>Send Money</li>
                        <li>Enter Number: <span className="font-mono font-bold text-white bg-black/50 px-2 py-0.5 rounded">+254 745 676 267</span></li>
                        <li>Enter Amount (e.g. 50, 100)</li>
                        <li>Copy the <span className="text-yellow-400">Transaction Code</span> (e.g. QWE123...) below.</li>
                    </ol>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-400 text-sm mb-1">Amount Sent (KES)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-green-500"
                            placeholder="e.g. 100"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-1">M-Pesa Transaction Code</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white font-mono placeholder:font-sans focus:outline-none focus:border-green-500 uppercase"
                            placeholder="e.g. KDA0..."
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`
                            w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2
                            ${loading ? "bg-gray-700 cursor-not-allowed text-gray-400" : "bg-green-600 hover:bg-green-500 text-white"}
                        `}
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Verify Payment"}
                    </button>
                </form>
            </div>
        </div>
    );
}
