import mongoose from "mongoose";
import PremiumTip from "@/backend/models/PremiumTip";
import AddTipForm from "./AddTipForm";
import DeleteTipButton from "./DeleteTipButton";
import UpdateTipStatus from "./UpdateTipStatus";
import EditTipModal from "./EditTipModal";
import AdminFixtureManager from "@/components/admin/AdminFixtureManager";
import { Sparkles, FileText } from "lucide-react";

export const metadata = {
  title: "Premium Tips Manager | Admin | BookiesMasters",
};

export const revalidate = 0;

export default async function AdminTipsPage() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI || "");
  }

  const tips = await PremiumTip.find().sort({ matchDate: -1 }).lean();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Sparkles className="text-amber-500 w-7 h-7" />
          Premium Tips & VIP Predictions Manager
        </h1>
        <p className="text-sm text-gray-500">
          Select a date to view games grouped per league (just like VIP users see on `/pro`). Click <strong className="text-gray-800">Edit</strong> on any game to customize its prediction tip and odds.
        </p>
      </div>

      {/* Main VIP Predictions Date Navigator & Fixture Editor */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <AdminFixtureManager />
      </div>

      {/* Legacy Betslips Manager Section */}
      <div className="pt-8 border-t border-gray-200">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-teal-600 w-5 h-5" />
            Legacy VIP Betslips Showcase Manager
          </h2>
          <p className="text-xs text-gray-500">Manually add or edit past winning betslips displayed on the unauthenticated Go Pro page.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Add Tip Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 sticky top-6 shadow-xs">
              <h3 className="text-base font-bold text-gray-900 mb-4">Add Legacy Tip</h3>
              <AddTipForm />
            </div>
          </div>

          {/* Right Column: Existing Legacy Tips */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-base font-bold text-gray-900 mb-2">Existing Legacy Betslips</h3>
            {tips.length === 0 ? (
              <p className="text-gray-500 text-sm">No legacy premium tips added yet.</p>
            ) : (
              tips.map((tip: any) => (
                <div key={tip._id.toString()} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-teal-600 mb-1 font-bold uppercase tracking-wider">{tip.country} - {tip.league}</div>
                    <div className="font-bold text-gray-900 text-base">{tip.homeTeam} vs {tip.awayTeam}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Date: {new Date(tip.matchDate).toLocaleString("en-GB", { timeZone: "Africa/Nairobi" })}
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="bg-gray-100 px-2.5 py-1 rounded text-xs text-gray-800 font-bold border border-gray-200">
                        Pick: <span className="text-teal-700">{tip.prediction}</span>
                      </span>
                      <span className="bg-amber-100 px-2.5 py-1 rounded text-xs text-amber-900 font-bold border border-amber-200">
                        Odds: <span>{tip.odds}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 shrink-0 w-full sm:w-auto">
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
