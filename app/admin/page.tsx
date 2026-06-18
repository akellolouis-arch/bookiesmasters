import mongoose from "mongoose";
import clientPromise from "@/lib/mongodb";
import PaymentRequest from "@/backend/models/PaymentRequest";
import User from "@/backend/models/User";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

export const metadata = {
  title: "Admin Dashboard",
};

export default async function AdminPage() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI || "");
  }

  const pendingPayments = await PaymentRequest.countDocuments({ status: "pending" });
  const totalVIPs = await User.countDocuments({ vipExpiry: { $gt: new Date() } });

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/payments" className="block group">
          <div className="bg-[#1F1F1F] p-6 rounded-xl border border-white/5 hover:border-[#63FF79]/50 transition-colors h-full flex flex-col justify-between">
            <div>
              <h3 className="text-gray-400 font-medium mb-2">Pending Payments</h3>
              <p className="text-4xl font-bold text-[#63FF79]">{pendingPayments}</p>
            </div>
            <div className="flex items-center text-[#63FF79] mt-4 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              Review Payments <ArrowRight className="ml-1 w-4 h-4" />
            </div>
          </div>
        </Link>
        
        <div className="bg-[#1F1F1F] p-6 rounded-xl border border-white/5 flex flex-col justify-between h-full">
          <div>
            <h3 className="text-gray-400 font-medium mb-2">Active VIP Users</h3>
            <p className="text-4xl font-bold text-white">{totalVIPs}</p>
          </div>
        </div>

        <Link href="/admin/tips" className="block group">
          <div className="bg-[#1F1F1F] p-6 rounded-xl border border-white/5 hover:border-white/50 transition-colors h-full flex flex-col justify-between">
            <div>
              <h3 className="text-gray-400 font-medium mb-2">Premium Tips Manager</h3>
              <div className="mt-4 text-gray-500">
                <FileText className="w-8 h-8" />
              </div>
            </div>
            <div className="flex items-center text-white mt-4 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              Manage Tips <ArrowRight className="ml-1 w-4 h-4" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
