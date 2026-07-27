import React from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import mongoose from "mongoose";
import PremiumTip from "@/backend/models/PremiumTip";
import { CheckCircle2 } from "lucide-react";
import PaystackCheckout from "@/components/PaystackCheckout";

export const metadata = {
  title: "Go Pro | BookiesMasters",
  description: "Get weekly VIP predictions and insights",
};

export default async function ProPage() {
  const session = await auth();

  let winningTips: any[] = [];
  try {
    if (process.env.MONGO_URI) {
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGO_URI);
      }

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      winningTips = await PremiumTip.find({
        status: 'won',
        matchDate: { $gte: sevenDaysAgo }
      }).sort({ matchDate: -1 }).limit(10).lean();
    }
  } catch (err) {
    console.error("⚠️ Pro page Mongo query error:", err);
  }

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

      {winningTips.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5 justify-center">
            <CheckCircle2 className="w-4 h-4 text-teal-500" /> 
            Recent VIP Wins
          </h2>
          <div className="flex overflow-x-auto pb-2 gap-3 snap-x [&::-webkit-scrollbar]:hidden">
            {winningTips.map((tip: any) => (
              <div key={tip._id.toString()} className="min-w-[200px] sm:min-w-[240px] flex-shrink-0 bg-teal-50/40 p-3 rounded-lg border border-teal-500/20 snap-start">
                <div className="text-[10px] text-teal-600 font-bold mb-1 uppercase tracking-wider">{tip.country} - {tip.league}</div>
                <div className="font-bold text-gray-900 text-[13px] mb-2 leading-tight">{tip.homeTeam} vs {tip.awayTeam}</div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-medium text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">Pick: {tip.prediction}</span>
                  <span className="font-bold text-teal-600 bg-white px-2 py-0.5 rounded border border-gray-200">Odds: {tip.odds}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto bg-white p-6 rounded-xl border border-teal-500/20 shadow-sm mt-8">
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Secure Checkout</h2>
          <p className="text-sm text-gray-600">Activate your 7-day VIP pass instantly.</p>
        </div>
        
        <PaystackCheckout amount={19} currency="USD" />
      </div>
    </div>
  );
}
