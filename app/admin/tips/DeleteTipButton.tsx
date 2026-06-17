"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export default function DeleteTipButton({ tipId }: { tipId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this tip?")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tips/${tipId}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to delete tip");
      }
    } catch (err) {
      alert("Error deleting tip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleDelete} disabled={loading} className="text-red-500 hover:text-red-400 p-1">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  );
}
