import mongoose from "mongoose";
import PremiumTip from "@/backend/models/PremiumTip";
import AddTipForm from "./AddTipForm";
import DeleteTipButton from "./DeleteTipButton";
import UpdateTipStatus from "./UpdateTipStatus";
import EditTipModal from "./EditTipModal";

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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Premium Tips Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-gray-200 sticky top-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Tip</h2>
            <AddTipForm />
          </div>
        </div>

        {/* Right Column: Existing Tips */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent VIP Tips</h2>
          <div className="space-y-4">
            {tips.length === 0 ? (
              <p className="text-gray-600">No premium tips added yet.</p>
            ) : (
              tips.map((tip: any) => (
                <div key={tip._id.toString()} className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[#63FF79] mb-1 font-bold">{tip.country} - {tip.league}</div>
                    <div className="font-bold text-gray-900 text-lg">{tip.homeTeam} vs {tip.awayTeam}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Date: {new Date(tip.matchDate).toLocaleString()}
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      <span className="bg-gray-50/50 px-3 py-1 rounded text-sm text-gray-700 font-bold border border-gray-300">
                        Pick: <span className="text-gray-900">{tip.prediction}</span>
                      </span>
                      <span className="bg-gray-50/50 px-3 py-1 rounded text-sm text-gray-700 font-bold border border-gray-300">
                        Odds: <span className="text-[#63FF79]">{tip.odds}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <UpdateTipStatus tipId={tip._id.toString()} currentStatus={tip.status} />
                    <div className="flex items-center gap-1">
                      <EditTipModal tip={tip} />
                      <DeleteTipButton tipId={tip._id.toString()} />
                    </div>
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
