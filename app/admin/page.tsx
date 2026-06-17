import mongoose from "mongoose";
import clientPromise from "@/lib/mongodb";
import PaymentRequest from "@/backend/models/PaymentRequest";
import User from "@/backend/models/User";

export const metadata = {
  title: "Admin Dashboard",
};

export default async function AdminPage() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI || "");
  }

  const pendingPayments = await PaymentRequest.countDocuments({ status: "pending" });
  const totalVIPs = await User.countDocuments({ vipExpiry: { $gt: new Date() } });

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1F1F1F] p-6 rounded-xl border border-white/5">
          <h3 className="text-gray-400 font-medium mb-2">Pending Payments</h3>
          <p className="text-4xl font-bold text-[#63FF79]">{pendingPayments}</p>
        </div>
        
        <div className="bg-[#1F1F1F] p-6 rounded-xl border border-white/5">
          <h3 className="text-gray-400 font-medium mb-2">Active VIP Users</h3>
          <p className="text-4xl font-bold text-white">{totalVIPs}</p>
        </div>
      </div>
    </div>
  );
}
