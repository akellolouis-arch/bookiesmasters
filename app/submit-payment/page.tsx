import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PaymentUploadForm from "@/app/pro/PaymentUploadForm";

export const metadata = {
  title: "Submit Payment Proof | BookiesMasters",
  description: "Submit your VIP payment proof",
};

export default async function SubmitPaymentPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/submit-payment");
  }

  const firstName = session.user.name ? session.user.name.split(" ")[0] : "there";

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-12">
      <div className="bg-[#1F1F1F] rounded-xl p-8 border border-white/5 shadow-xl text-center">
        <h1 className="text-3xl font-bold text-white mb-4">
          Hi, <span className="text-[#63FF79]">{firstName}</span>!
        </h1>
        
        <div className="bg-[#63FF79]/10 border border-[#63FF79]/30 rounded-lg p-6 mb-8 text-left">
          <h2 className="text-[#63FF79] font-bold text-lg mb-2">Next Steps:</h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            Please submit your payment screenshot using the form below. Our admin team will review your transaction against our records. 
          </p>
          <p className="text-white text-sm font-semibold">
            Upon payment approval, you will immediately unlock full access to all premium VIP tips!
          </p>
        </div>

        <div className="text-left">
          <PaymentUploadForm />
        </div>
      </div>
    </div>
  );
}
