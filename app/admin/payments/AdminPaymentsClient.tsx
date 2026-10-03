"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import PaymentActions from "./PaymentActions";
import {
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  Globe,
  Building,
  Trash2,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

const COUNTRY_FLAGS: Record<string, { name: string; flag: string }> = {
  ZA: { name: "South Africa", flag: "🇿🇦" },
  KE: { name: "Kenya", flag: "🇰🇪" },
  NG: { name: "Nigeria", flag: "🇳🇬" },
  GH: { name: "Ghana", flag: "🇬🇭" },
  UG: { name: "Uganda", flag: "🇺🇬" },
  TZ: { name: "Tanzania", flag: "🇹🇿" },
  RW: { name: "Rwanda", flag: "🇷🇼" },
  GB: { name: "United Kingdom", flag: "🇬🇧" },
  US: { name: "United States", flag: "🇺🇸" },
};

interface PaymentItem {
  _id: string;
  userName: string;
  userEmail: string;
  paymentMethod: string;
  reference?: string;
  status: "pending" | "approved" | "rejected";
  amount?: number;
  currency?: string;
  country?: string;
  bank?: string;
  brand?: string;
  channel?: string;
  screenshotUrl?: string;
  paidAt?: string;
  createdAt: string;
  hasActiveVip?: boolean;
  vipExpiry?: string | null;
}

export default function AdminPaymentsClient({ initialPayments }: { initialPayments: PaymentItem[] }) {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentItem[]>(initialPayments);
  const [filter, setFilter] = useState<"all" | "approved" | "pending" | "rejected">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const approvedPayments = payments.filter((p) => p.status === "approved");
  const pendingPayments = payments.filter((p) => p.status === "pending");
  const rejectedPayments = payments.filter((p) => p.status === "rejected");

  const totalRevenue = approvedPayments.reduce((acc, p) => acc + (p.amount || 2500), 0);

  const displayedPayments = payments.filter((p) => {
    if (filter === "all") return true;
    return p.status === filter;
  });

  const handleDelete = async (paymentId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete this payment record for ${email} from the display?`)) {
      return;
    }

    setDeletingId(paymentId);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPayments((prev) => prev.filter((p) => p._id !== paymentId));
        router.refresh();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || "Failed to delete"}`);
      }
    } catch (err) {
      alert("Network error: Failed to delete payment record");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Revenue</div>
            <div className="text-xl font-black text-gray-900">KES {totalRevenue.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Approved Payments</div>
            <div className="text-xl font-black text-gray-900">{approvedPayments.length}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Pending Payments</div>
            <div className="text-xl font-black text-gray-900">{pendingPayments.length}</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filter === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All ({payments.length})
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filter === "approved" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Approved ({approvedPayments.length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filter === "pending" ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Pending ({pendingPayments.length})
        </button>
        <button
          onClick={() => setFilter("rejected")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filter === "rejected" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Rejected ({rejectedPayments.length})
        </button>
      </div>

      {/* Payments List */}
      {displayedPayments.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-gray-200 text-gray-500 text-sm">
          No payments found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedPayments.map((p) => {
            const countryMeta = p.country ? COUNTRY_FLAGS[p.country.toUpperCase()] : null;

            return (
              <div
                key={p._id}
                className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between gap-3 relative"
              >
                {/* Header */}
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-gray-900 text-base">{p.userName}</h3>
                    <p className="text-xs text-gray-500">{p.userEmail}</p>

                    {/* LIVE VIP ACCESS STATUS BADGE */}
                    <div className="pt-1">
                      {p.hasActiveVip ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300/80 px-2.5 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <ShieldCheck size={13} className="text-emerald-600" />
                          <span>
                            VIP Active (Expires:{" "}
                            {new Date(p.vipExpiry!).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                            )
                          </span>
                        </span>
                      ) : p.vipExpiry ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-600 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-full">
                          <AlertCircle size={13} className="text-gray-400" />
                          <span>
                            VIP Expired (
                            {new Date(p.vipExpiry).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                            )
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                          No VIP pass currently active
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {p.status === "approved" && (
                      <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 size={12} /> Approved
                      </span>
                    )}
                    {p.status === "pending" && (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                        <Clock size={12} /> Pending Review
                      </span>
                    )}
                    {p.status === "rejected" && (
                      <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                        <XCircle size={12} /> Rejected
                      </span>
                    )}

                    {/* DELETE BUTTON */}
                    <button
                      type="button"
                      onClick={() => handleDelete(p._id, p.userEmail)}
                      disabled={deletingId === p._id}
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Delete this payment record from the display"
                    >
                      {deletingId === p._id ? (
                        <Loader2 size={15} className="animate-spin text-red-500" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Amount & Method */}
                <div className="flex items-center justify-between py-2 border-y border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-gray-900">
                      {p.currency || "KES"} {(p.amount || 2500).toLocaleString()}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        p.paymentMethod === "paystack"
                          ? "bg-teal-50 text-teal-700 border border-teal-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {p.paymentMethod}
                    </span>
                  </div>
                  {p.reference && (
                    <span className="text-[10px] font-mono text-gray-400 truncate max-w-[150px]" title={p.reference}>
                      Ref: {p.reference}
                    </span>
                  )}
                </div>

                {/* Location & Bank Details */}
                {(p.country || p.bank) && (
                  <div className="bg-gray-50 p-2.5 rounded-lg text-xs space-y-1">
                    {p.country && (
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <Globe size={13} className="text-gray-400 shrink-0" />
                        <span>
                          Country:{" "}
                          <strong className="text-gray-900">
                            {countryMeta ? `${countryMeta.flag} ${countryMeta.name} (${p.country})` : p.country}
                          </strong>
                        </span>
                      </div>
                    )}
                    {p.bank && (
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <Building size={13} className="text-gray-400 shrink-0" />
                        <span>
                          Bank / Card:{" "}
                          <strong className="text-gray-900">
                            {p.bank} {p.brand ? `• ${p.brand}` : ""}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Timestamp */}
                <div className="text-[11px] text-gray-400">
                  Paid / Submitted: {new Date(p.paidAt || p.createdAt).toLocaleString()}
                </div>

                {/* Proof screenshot for manual M-PESA */}
                {p.screenshotUrl && (
                  <div className="mt-1">
                    <a
                      href={p.screenshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full h-36 relative rounded-lg overflow-hidden border border-gray-200 group"
                    >
                      <img
                        src={p.screenshotUrl}
                        alt="Payment Proof"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                        View Full Screenshot
                      </div>
                    </a>
                  </div>
                )}

                {/* Actions for Pending */}
                {p.status === "pending" && (
                  <PaymentActions paymentId={p._id} userEmail={p.userEmail} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
