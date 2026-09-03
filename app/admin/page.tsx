import mongoose from "mongoose";
import PaymentRequest from "@/backend/models/PaymentRequest";
import User from "@/backend/models/User";
import Link from "next/link";
import { ArrowRight, FileText, ShieldCheck } from "lucide-react";
import AdminFixtureManager from "@/components/admin/AdminFixtureManager";

export const metadata = {
  title: "Admin Dashboard | BookiesMasters",
};

export default async function AdminPage() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI || "");
  }

  const pendingPayments = await PaymentRequest.countDocuments({ status: "pending" });
  const totalVIPs = await User.countDocuments({ vipExpiry: { $gt: new Date() } });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">Manage VIP payments, user subscriptions, and custom match predictions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/payments" className="block group">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-teal-500 transition-all shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-1">Pending Payments</h3>
              <p className="text-4xl font-black text-teal-600">{pendingPayments}</p>
            </div>
            <div className="flex items-center text-teal-600 mt-4 text-xs font-bold opacity-80 group-hover:opacity-100 transition-opacity">
              Review Payments <ArrowRight className="ml-1 w-4 h-4" />
            </div>
          </div>
        </Link>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-1">Active VIP Users</h3>
            <p className="text-4xl font-black text-gray-900">{totalVIPs}</p>
          </div>
          <div className="flex items-center text-gray-400 mt-4 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 mr-1 text-emerald-500" /> Active Subscribers
          </div>
        </div>

        <Link href="/admin/tips" className="block group">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-amber-500 transition-all shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-1">Legacy Tips Manager</h3>
              <div className="mt-2 text-gray-700">
                <FileText className="w-7 h-7 text-amber-500" />
              </div>
            </div>
            <div className="flex items-center text-amber-600 mt-4 text-xs font-bold opacity-80 group-hover:opacity-100 transition-opacity">
              View Legacy Betslips <ArrowRight className="ml-1 w-4 h-4" />
            </div>
          </div>
        </Link>
      </div>

      {/* Database Fixtures & VIP Prediction Editor */}
      <div className="pt-4 border-t border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">VIP Match Predictions Editor</h2>
        <AdminFixtureManager />
      </div>
    </div>
  );
}
