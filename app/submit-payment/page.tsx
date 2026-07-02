import React from "react";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import PaymentUploadForm from "@/app/pro/PaymentUploadForm";

export const metadata = {
  title: "Submit Payment Proof | BookiesMasters",
  description: "Submit your VIP payment proof",
};

export default async function SubmitPaymentPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=/submit-payment");
  }

  // @ts-ignore
  if (session.user.role === 'admin') {
    redirect("/admin");
  }

  // @ts-ignore
  const vipExpiry = session.user.vipExpiry ? new Date(session.user.vipExpiry) : null;
  const isVIP = vipExpiry && vipExpiry > new Date();
  
  if (isVIP) {
    redirect("/vip");
  }

  const firstName = session.user.name ? session.user.name.split(" ")[0] : "there";

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-xl text-center relative">
        <div className="absolute top-4 right-4">
          <form action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}>
            <button type="submit" className="text-xs text-gray-600 hover:text-gray-900 border border-gray-600 hover:border-white px-3 py-1 rounded transition-colors">
              Log out
            </button>
          </form>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4 mt-4">
          Hi, <span className="text-[#63FF79]">{firstName}</span>!
        </h1>
        
        <div className="bg-[#63FF79]/10 border border-[#63FF79]/30 rounded-lg p-6 mb-8 text-left">
          <h2 className="text-[#63FF79] font-bold text-lg mb-2">Next Steps:</h2>
          <p className="text-gray-700 text-sm leading-relaxed mb-4">
            Please submit your payment screenshot using the form below. Our admin team will review your transaction against our records. 
          </p>
          <p className="text-gray-900 text-sm font-semibold">
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
