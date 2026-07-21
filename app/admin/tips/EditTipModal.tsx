"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Edit, X } from "lucide-react";

export default function EditTipModal({ tip }: { tip: any }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Format the date for the datetime-local input
  const formatDateForInput = (dateString: string) => {
    const d = new Date(dateString);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    homeTeam: tip.homeTeam,
    awayTeam: tip.awayTeam,
    country: tip.country,
    league: tip.league,
    matchDate: formatDateForInput(tip.matchDate),
    prediction: tip.prediction,
    odds: tip.odds
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // We'll use the PATCH route but with the full data. The PATCH logic needs to support updating these fields.
      // Wait, our implementation plan said we use PUT. Let's use PUT and we'll implement it in the route.
      const res = await fetch(`/api/admin/tips/${tip._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsOpen(false);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update tip");
      }
    } catch (err) {
      alert("Error updating tip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-gray-400 hover:text-blue-500 transition-colors p-1"
        title="Edit Tip"
      >
        <Edit className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Premium Tip</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Home Team</label>
                  <input required name="homeTeam" value={formData.homeTeam} onChange={handleChange} className="w-full bg-white border border-gray-300 rounded p-2 text-sm text-gray-900" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Away Team</label>
                  <input required name="awayTeam" value={formData.awayTeam} onChange={handleChange} className="w-full bg-white border border-gray-300 rounded p-2 text-sm text-gray-900" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Country</label>
                  <input required name="country" value={formData.country} onChange={handleChange} className="w-full bg-white border border-gray-300 rounded p-2 text-sm text-gray-900" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">League</label>
                  <input required name="league" value={formData.league} onChange={handleChange} className="w-full bg-white border border-gray-300 rounded p-2 text-sm text-gray-900" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Match Date & Time</label>
                <input required type="datetime-local" name="matchDate" value={formData.matchDate} onChange={handleChange} className="w-full bg-white border border-gray-300 rounded p-2 text-sm text-gray-900" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Prediction</label>
                  <input required name="prediction" value={formData.prediction} onChange={handleChange} className="w-full bg-white border border-gray-300 rounded p-2 text-sm text-gray-900" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Odds</label>
                  <input required name="odds" value={formData.odds} onChange={handleChange} className="w-full bg-white border border-gray-300 rounded p-2 text-sm text-gray-900" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 border border-gray-300 text-gray-700 font-bold py-2 rounded hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded flex justify-center items-center disabled:opacity-50">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
