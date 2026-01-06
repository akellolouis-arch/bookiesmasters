"use client";

import { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { Loader2, Lock, Save, DollarSign } from "lucide-react";

// Helper to format date YYYY-MM-DD
const formatISODate = (date: Date) => date.toISOString().split('T')[0];

// Helper to format time HH:mm
const formatTime = (isoString: string) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminMatchesPage() {
    const { data: session } = useSession();
    const [date, setDate] = useState(formatISODate(new Date()));
    const [editingMatch, setEditingMatch] = useState<any>(null);

    // Fetch matches for the selected date
    const { data: matches, error, isLoading, mutate } = useSWR(
        `/api/matches?date=${date}`,
        fetcher
    );

    const handleSave = async (fixtureId: number, updateData: any) => {
        try {
            const res = await fetch("/api/admin/matches/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fixtureId, ...updateData }),
            });
            if (res.ok) {
                alert("Match Updated!");
                setEditingMatch(null);
                mutate(); // Refresh list
            } else {
                alert("Update failed");
            }
        } catch (e) {
            alert("Error saving");
        }
    };

    if (!session || session.user?.email !== "emoitakelo@gmail.com") {
        return <div className="p-10 text-white">Access Denied. Admins Only. (Checked against emoitakelo@gmail.com)</div>;
    }

    return (
        <div className="min-h-screen bg-[#121212] text-white p-8">
            <h1 className="text-3xl font-bold mb-8 text-yellow-500">Admin: Manage VIP Tips</h1>

            {/* Date Selector */}
            <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Select Date:</label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded p-2 text-white"
                />
            </div>

            {/* Matches List */}
            {isLoading ? (
                <Loader2 className="animate-spin" />
            ) : (
                <div className="space-y-4">
                    {matches?.fixtures?.map((leagueData: any) => (
                        <div key={leagueData.league.id} className="bg-[#1e1e1e] rounded-lg p-4">
                            <h2 className="text-xl font-bold text-gray-300 mb-4 border-b border-gray-700 pb-2">
                                {leagueData.league.name} ({leagueData.league.country})
                            </h2>
                            <div className="grid gap-4">
                                {leagueData.matches.map((match: any) => (
                                    <div key={match.fixtureId} className="flex flex-col md:flex-row items-center justify-between bg-black/30 p-4 rounded gap-4">

                                        {/* Match Info */}
                                        <div className="flex-1">
                                            <div className="text-sm text-gray-500">{formatTime(match.time)}</div>
                                            <div className="font-bold text-lg">
                                                {match.homeTeam.name} vs {match.awayTeam.name}
                                            </div>
                                            {match.isVip && (
                                                <div className="inline-flex items-center gap-1 bg-yellow-500/20 text-yellow-500 text-xs px-2 py-1 rounded mt-1">
                                                    <Lock className="w-3 h-3" /> VIP ({match.creditCost} CR)
                                                </div>
                                            )}
                                        </div>

                                        {/* Edit Controls */}
                                        <button
                                            onClick={() => setEditingMatch(match)}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold text-sm"
                                        >
                                            Edit Prediction
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {editingMatch && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Edit Match</h3>
                        <p className="mb-4 text-gray-400">{editingMatch.homeTeam.name} vs {editingMatch.awayTeam.name}</p>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                handleSave(editingMatch.fixtureId, {
                                    prediction: formData.get("prediction"),
                                    odds: formData.get("odds"),
                                    isVip: formData.get("isVip") === "on",
                                    creditCost: Number(formData.get("creditCost")),
                                });
                            }}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm mb-1">Our Prediction</label>
                                <input name="prediction" defaultValue={editingMatch.prediction} className="w-full bg-black border border-gray-600 rounded p-2" required />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Odds</label>
                                <input name="odds" defaultValue={editingMatch.odds} className="w-full bg-black border border-gray-600 rounded p-2" step="0.01" type="number" required />
                            </div>

                            <div className="flex items-center gap-3 py-2 border-t border-gray-700 mt-4">
                                <input type="checkbox" name="isVip" id="isVip" defaultChecked={editingMatch.isVip} className="w-5 h-5" />
                                <label htmlFor="isVip" className="font-bold text-yellow-500 flex items-center gap-2">
                                    <Lock className="w-4 h-4" /> Make this a VIP Tip?
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Credit Cost</label>
                                <input name="creditCost" type="number" defaultValue={editingMatch.creditCost || 20} className="w-full bg-black border border-gray-600 rounded p-2" />
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button type="button" onClick={() => setEditingMatch(null)} className="flex-1 py-2 bg-gray-600 rounded">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-yellow-500 text-black font-bold rounded flex items-center justify-center gap-2">
                                    <Save className="w-4 h-4" /> Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
