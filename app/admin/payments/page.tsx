"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Check, X, RefreshCcw } from "lucide-react";

interface Request {
    _id: string;
    email: string;
    amount: number;
    mpesaCode: string;
    status: string;
    date: string;
}

export default function AdminPaymentsPage() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const res = await fetch(`${baseUrl}/api/payment/admin/requests`);
            const data = await res.json();
            setRequests(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApprove = async (id: string) => {
        if (!confirm("Approve this payment?")) return;
        setActionLoading(id);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const res = await fetch(`${baseUrl}/api/payment/admin/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId: id })
            });
            if (res.ok) {
                // Remove from list
                setRequests(prev => prev.filter(r => r._id !== id));
            } else {
                alert("Failed to approve");
            }
        } catch (err) {
            alert("Error");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;

        setActionLoading(id);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const res = await fetch(`${baseUrl}/api/payment/admin/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId: id, reason })
            });
            if (res.ok) {
                setRequests(prev => prev.filter(r => r._id !== id));
            }
        } catch (err) {
            alert("Error");
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#121212] p-6">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-white">Pending Payments</h1>
                    <button onClick={fetchRequests} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-white">
                        <RefreshCcw className="w-5 h-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-20"><Loader2 className="animate-spin w-8 h-8 text-white mx-auto" /></div>
                ) : (
                    <div className="bg-[#1e1e1e] rounded-xl overflow-hidden border border-white/10">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-black/40 uppercase font-bold text-gray-300">
                                <tr>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">User</th>
                                    <th className="p-4">Code</th>
                                    <th className="p-4">Amount</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {requests.length === 0 && (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">No pending requests</td></tr>
                                )}
                                {requests.map(req => (
                                    <tr key={req._id} className="hover:bg-white/5">
                                        <td className="p-4">{new Date(req.date).toLocaleDateString()} {new Date(req.date).toLocaleTimeString()}</td>
                                        <td className="p-4 font-medium text-white">{req.email}</td>
                                        <td className="p-4 font-mono text-yellow-400">{req.mpesaCode}</td>
                                        <td className="p-4 text-green-400 font-bold">{req.amount} KES</td>
                                        <td className="p-4 flex justify-end gap-2">
                                            <button
                                                onClick={() => handleApprove(req._id)}
                                                disabled={!!actionLoading}
                                                className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg"
                                            >
                                                {actionLoading === req._id ? <Loader2 className="animate-spin w-4 h-4" /> : <Check className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleReject(req._id)}
                                                disabled={!!actionLoading}
                                                className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
