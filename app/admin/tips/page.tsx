import mongoose from "mongoose";
import PremiumTip from "@/backend/models/PremiumTip";
import AddTipForm from "./AddTipForm";
import DeleteTipButton from "./DeleteTipButton";

export const metadata = {
  title: "Manage Premium Tips",
};

export const revalidate = 0;

export default async function AdminTipsPage() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI || "");
  }

  const tips = await PremiumTip.find().sort({ matchDate: -1 }).lean();

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Premium Tips Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-1">
          <div className="bg-[#1F1F1F] p-6 rounded-xl border border-white/5 sticky top-6">
            <h2 className="text-xl font-bold text-white mb-4">Add New Tip</h2>
            <AddTipForm />
          </div>
        </div>

        {/* Right Column: Existing Tips */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-white mb-4">Recent VIP Tips</h2>
          <div className="space-y-4">
            {tips.length === 0 ? (
              <p className="text-gray-400">No premium tips added yet.</p>
            ) : (
              tips.map((tip: any) => (
                <div key={tip._id.toString()} className="bg-[#1F1F1F] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[#63FF79] mb-1 font-bold">{tip.country} - {tip.league}</div>
                    <div className="font-bold text-white text-lg">{tip.homeTeam} vs {tip.awayTeam}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      Date: {new Date(tip.matchDate).toLocaleString()}
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      <span className="bg-black/50 px-3 py-1 rounded text-sm text-gray-300 font-bold border border-white/10">
                        Pick: <span className="text-white">{tip.prediction}</span>
                      </span>
                      <span className="bg-black/50 px-3 py-1 rounded text-sm text-gray-300 font-bold border border-white/10">
                        Odds: <span className="text-[#63FF79]">{tip.odds}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${tip.status === 'won' ? 'bg-green-500/20 text-green-500' : tip.status === 'lost' ? 'bg-red-500/20 text-red-500' : 'bg-gray-500/20 text-gray-400'}`}>
                      {tip.status}
                    </span>
                    <DeleteTipButton tipId={tip._id.toString()} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
