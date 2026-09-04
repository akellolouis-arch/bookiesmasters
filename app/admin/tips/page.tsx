import AdminFixtureManager from "@/components/admin/AdminFixtureManager";
import { Sparkles } from "lucide-react";

export const metadata = {
  title: "Premium Tips Manager | Admin | BookiesMasters",
};

export const revalidate = 0;

export default async function AdminTipsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Sparkles className="text-amber-500 w-7 h-7" />
          Premium Tips & VIP Predictions Manager
        </h1>
        <p className="text-sm text-gray-500">
          Select a date to view games grouped per league (just like VIP users see on <strong className="text-gray-800">/pro</strong>). Click <strong className="text-gray-800">Edit</strong> on any game to customize its prediction tip, odds, and result.
        </p>
      </div>

      {/* Main VIP Predictions Date Navigator & Fixture Editor */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <AdminFixtureManager />
      </div>
    </div>
  );
}
