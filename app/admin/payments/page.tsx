import mongoose from "mongoose";
import PaymentRequest from "@/backend/models/PaymentRequest";
import User from "@/backend/models/User";
import AdminPaymentsClient from "./AdminPaymentsClient";

export const metadata = {
  title: "Payments Dashboard | Admin",
};

export const revalidate = 0; // Disable caching

export default async function AdminPaymentsPage() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI || "");
  }

  const rawPayments = await PaymentRequest.find({}).sort({ createdAt: -1 }).lean();

  // Lookup the corresponding User documents to check live VIP access
  const userEmails = [...new Set(rawPayments.map((p: any) => p.userEmail?.toLowerCase()).filter(Boolean))];
  const users = await User.find({ email: { $in: userEmails } }).select("email vipExpiry isVip").lean();
  const userMap = new Map(users.map((u: any) => [u.email?.toLowerCase(), u]));

  const now = new Date();
  const enrichedPayments = rawPayments.map((p: any) => {
    const user = userMap.get(p.userEmail?.toLowerCase());
    const expiry = user?.vipExpiry ? new Date(user.vipExpiry) : null;
    const hasActiveVip = Boolean(user?.isVip || (expiry && expiry > now));
    return {
      ...p,
      hasActiveVip,
      vipExpiry: expiry ? expiry.toISOString() : null,
    };
  });

  const payments = JSON.parse(JSON.stringify(enrichedPayments));

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Payments Dashboard</h1>
        <p className="text-xs text-gray-500 mt-1">
          Monitor automated Paystack payments, card & mobile money origins, and customer VIP subscriptions.
        </p>
      </div>

      <AdminPaymentsClient initialPayments={payments} />
    </div>
  );
}
