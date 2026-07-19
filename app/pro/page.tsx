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
    <div className="w-full max-w-3xl mx-auto px-4 py-4 md:py-6 relative">
      {session?.user && (
        <div className="absolute top-2 right-4 md:top-4 md:right-4">
          <form action={async () => {
            "use server";
            await signOut({ redirectTo: "/pro" });
          }}>
            <button type="submit" className="text-xs text-gray-600 hover:text-gray-900 border border-gray-600 hover:border-gray-900 px-2 py-1 rounded transition-colors">
              Log out
            </button>
          </form>
        </div>
      )}

      <div className="text-center mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 tracking-tight mt-6 md:mt-0">
          Upgrade to <span className="text-teal-600">VIP</span>
        </h1>
        <p className="text-gray-600 text-[13px] max-w-xl mx-auto">
          Get premium predictions and expert insights for just <strong className="text-gray-900">$19 / week</strong>.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* Payment Details Column */}
        <div className="p-2 md:p-4">
          <h2 className="text-base font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">Payment Methods</h2>
          
          <div className="space-y-4">
            {/* M-Pesa */}
            <div className="p-3 rounded border border-teal-500/20 bg-teal-50/30">
              <h3 className="text-teal-700 font-semibold mb-1 flex items-center gap-1.5 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                M-Pesa
              </h3>
              <div className="text-gray-700 text-[11px] sm:text-xs space-y-1.5">
                <p>Send exactly <strong className="text-gray-900">Ksh 2,500</strong> to:</p>
                <div className="bg-white p-2 rounded font-mono text-center text-[13px] tracking-wider border border-gray-200">
                  +254745676267
                </div>
              </div>
            </div>

            {/* Crypto Wallet */}
            <div className="p-3 rounded border border-yellow-500/20 bg-yellow-50/30">
              <h3 className="text-yellow-700 font-semibold mb-1 flex items-center gap-1.5 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                Crypto Wallet (USDT / BNB)
              </h3>
              <div className="text-gray-700 text-[11px] sm:text-xs space-y-1.5">
                <p>Send exactly <strong className="text-gray-900">19 USDT</strong> on the <strong className="text-gray-900">BEP-20 Network</strong> to:</p>
                <div className="bg-white p-2 rounded font-mono text-center text-[10px] sm:text-[11px] border border-gray-200 break-all">
                  0x84Cb45E605722EFFa9896d689C53972ccAC50242
                </div>
                <p className="text-[9px] text-gray-500 leading-tight">* Ensure you select the BNB Smart Chain (BEP-20) network to avoid losing funds.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Form Column */}
        <div className="p-4 flex flex-col items-center justify-center text-center">
          <h2 className="text-base font-bold text-gray-900 mb-1 border-b border-gray-200 pb-2 w-full">Verify Payment</h2>
          <p className="text-xs text-gray-600 mb-4 mt-3">Already paid? Upload screenshot to get access.</p>
          
          {session?.user ? (
            <Link href="/submit-payment" className="w-full">
              <button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 px-3 rounded shadow-sm transition-colors text-[13px]">
                Submit Payment Proof
              </button>
            </Link>
          ) : (
            <Link href="/api/auth/signin?callbackUrl=/submit-payment" className="w-full">
              <button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 px-3 rounded shadow-sm transition-colors text-[13px]">
                Login to Submit Payment
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
