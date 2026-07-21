"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function UpdateTipStatus({ tipId, currentStatus }: { tipId: string, currentStatus: string }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;
    
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/tips/${tipId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update status");
      }
    } catch (error) {
      alert("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
      <select
        value={currentStatus}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={isUpdating}
        className={`text-xs px-2 py-1 rounded font-bold uppercase outline-none cursor-pointer border-r-4 border-transparent ${
          currentStatus === 'won' ? 'bg-teal-500/20 text-teal-600' : 
          currentStatus === 'lost' ? 'bg-red-500/20 text-red-500' : 
          'bg-gray-500/20 text-gray-600'
        }`}
      >
        <option value="pending" className="bg-white text-gray-900">Pending</option>
        <option value="won" className="bg-white text-gray-900">Won</option>
        <option value="lost" className="bg-white text-gray-900">Lost</option>
      </select>
    </div>
  );
}
