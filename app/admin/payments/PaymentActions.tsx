"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";

export default function PaymentActions({ paymentId, userEmail }: { paymentId: string, userEmail: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this payment for ${userEmail}?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert("Failed to process action");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-4 mt-4">
      <button 
        onClick={() => handleAction('approve')}
        disabled={loading}
        className="flex-1 bg-[#63FF79] hover:bg-[#4ade80] text-black font-bold py-2 px-4 rounded flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Approve
      </button>
      <button 
        onClick={() => handleAction('reject')}
        disabled={loading}
        className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-2 px-4 rounded border border-red-500/30 flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />} Reject
      </button>
    </div>
  );
}
