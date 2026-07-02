import React from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

export const metadata = {
  title: "Go Pro | BookiesMasters",
  description: "Get weekly VIP predictions and insights",
};

export default async function ProPage() {
  const session = await auth();

  if (session?.user) {
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
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12 relative">
      {session?.user && (
        <div className="absolute top-4 right-4 md:top-8 md:right-4">
          <form action={async () => {
            "use server";
            await signOut({ redirectTo: "/pro" });
          }}>
            <button type="submit" className="text-xs text-gray-600 hover:text-gray-900 border border-gray-600 hover:border-white px-3 py-1 rounded transition-colors">
              Log out
            </button>
          </form>
        </div>
      )}

      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight mt-6 md:mt-0">
          Upgrade to <span className="text-[#63FF79]">VIP</span>
        </h1>
        <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
          Get exclusive access to our premium predictions, high-confidence picks, and expert insights for just <strong className="text-gray-900">$19 per week</strong>.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Payment Details Column */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-xl">
          <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-300 pb-3">Payment Methods</h2>
          
          <div className="space-y-6">
            {/* M-Pesa */}
            <div className="bg-white p-4 rounded-lg border border-[#63FF79]/20 relative overflow-hidden">
              <h3 className="text-[#63FF79] font-bold mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#63FF79] animate-pulse"></span>
                M-Pesa
              </h3>
              <div className="text-gray-700 text-sm space-y-2">
                <p>Send exactly <strong className="text-gray-900">Ksh 2,500</strong> to:</p>
                <div className="bg-gray-50/50 p-3 rounded font-mono text-center text-lg tracking-widest border border-gray-300">
                  +254745676267
                </div>
              </div>
            </div>

            {/* Crypto Wallet */}
            <div className="bg-white p-4 rounded-lg border border-yellow-500/20 relative overflow-hidden">
              <h3 className="text-yellow-500 font-bold mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                Crypto Wallet (USDT / BNB)
              </h3>
              <div className="text-gray-700 text-sm space-y-2">
                <p>Send exactly <strong className="text-gray-900">19 USDT</strong> on the <strong className="text-gray-900">BEP-20 Network</strong> to:</p>
                <div className="bg-gray-50/50 p-3 rounded font-mono text-center text-xs sm:text-sm border border-gray-300 break-all">
                  0x84Cb45E605722EFFa9896d689C53972ccAC50242
                </div>
                <p className="text-xs text-gray-500 mt-2">* Ensure you select the BNB Smart Chain (BEP-20) network to avoid losing funds.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Form Column */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-xl flex flex-col items-center justify-center text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Verify Payment</h2>
          <p className="text-sm text-gray-600 mb-6">Have you already made your payment? Upload your screenshot to gain access to premium tips.</p>
          
          {session?.user ? (
            <Link href="/submit-payment" className="w-full">
              <button className="w-full bg-[#63FF79] hover:bg-[#4ade80] text-black font-bold py-4 px-6 rounded-lg transition-colors shadow-[0_0_20px_rgba(99,255,121,0.2)]">
                Submit Payment Proof
              </button>
            </Link>
          ) : (
            <Link href="/api/auth/signin?callbackUrl=/submit-payment" className="w-full">
              <button className="w-full bg-[#63FF79] hover:bg-[#4ade80] text-black font-bold py-4 px-6 rounded-lg transition-colors shadow-[0_0_20px_rgba(99,255,121,0.2)]">
                Login to Submit Payment
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
