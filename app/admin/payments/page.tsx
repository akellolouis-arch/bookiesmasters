import mongoose from "mongoose";
import PaymentRequest from "@/backend/models/PaymentRequest";
import PaymentActions from "./PaymentActions";

export const metadata = {
  title: "Pending Payments",
};

export const revalidate = 0; // Disable caching

export default async function AdminPaymentsPage() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI || "");
  }

  const payments = await PaymentRequest.find({ status: "pending" }).sort({ createdAt: -1 }).lean();

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Pending Payments</h1>

      {payments.length === 0 ? (
        <div className="bg-[#1F1F1F] p-8 text-center rounded-xl border border-white/5 text-gray-400">
          No pending payment requests.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {payments.map((payment: any) => (
            <div key={payment._id.toString()} className="bg-[#1F1F1F] p-6 rounded-xl border border-white/5 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white">{payment.userName}</h3>
                  <p className="text-sm text-gray-400">{payment.userEmail}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${payment.paymentMethod === 'mpesa' ? 'bg-[#63FF79]/20 text-[#63FF79]' : 'bg-yellow-500/20 text-yellow-500'}`}>
                  {payment.paymentMethod}
                </span>
              </div>
              
              <div className="text-xs text-gray-500">
                Submitted: {new Date(payment.createdAt).toLocaleString()}
              </div>

              <div className="mt-2">
                <a href={payment.screenshotUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-48 relative rounded-lg overflow-hidden border border-white/10 group cursor-zoom-in">
                  <img src={payment.screenshotUrl} alt="Payment Proof" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white font-bold bg-black/50 px-4 py-2 rounded-full">View Full Image</span>
                  </div>
                </a>
              </div>

              <PaymentActions paymentId={payment._id.toString()} userEmail={payment.userEmail} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
