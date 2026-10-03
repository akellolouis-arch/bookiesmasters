import mongoose from "mongoose";
import PaymentRequest from "@/backend/models/PaymentRequest";
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
  const payments = JSON.parse(JSON.stringify(rawPayments));

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Payments Dashboard</h1>
        <p className="text-xs text-gray-500 mt-1">
          Monitor automated Paystack payments, card origins, and review manual M-PESA subscriptions.
        </p>
      </div>

      <AdminPaymentsClient initialPayments={payments} />
    </div>
  );
}
