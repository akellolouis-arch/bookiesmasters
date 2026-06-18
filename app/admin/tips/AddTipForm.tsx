"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AddTipForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    homeTeam: "",
    awayTeam: "",
    country: "",
    league: "",
    matchDate: "",
    prediction: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setFormData({
          homeTeam: "", awayTeam: "", country: "", league: "", matchDate: "", prediction: ""
        });
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add tip");
      }
    } catch (err) {
      alert("Error adding tip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Home Team</label>
          <input required name="homeTeam" value={formData.homeTeam} onChange={handleChange} className="w-full bg-[#121212] border border-white/10 rounded p-2 text-sm text-white" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Away Team</label>
          <input required name="awayTeam" value={formData.awayTeam} onChange={handleChange} className="w-full bg-[#121212] border border-white/10 rounded p-2 text-sm text-white" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Country</label>
          <input required name="country" value={formData.country} onChange={handleChange} className="w-full bg-[#121212] border border-white/10 rounded p-2 text-sm text-white" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">League</label>
          <input required name="league" value={formData.league} onChange={handleChange} className="w-full bg-[#121212] border border-white/10 rounded p-2 text-sm text-white" />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Match Date & Time</label>
        <input required type="datetime-local" name="matchDate" value={formData.matchDate} onChange={handleChange} className="w-full bg-[#121212] border border-white/10 rounded p-2 text-sm text-white" />
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Prediction (e.g. Home Win)</label>
        <input required name="prediction" value={formData.prediction} onChange={handleChange} className="w-full bg-[#121212] border border-white/10 rounded p-2 text-sm text-white" />
      </div>

      <button type="submit" disabled={loading} className="w-full bg-[#63FF79] hover:bg-[#4ade80] text-black font-bold py-2 rounded flex justify-center items-center disabled:opacity-50">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Add Premium Tip"}
      </button>
    </form>
  );
}
