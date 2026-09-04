import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import mongoose from "mongoose";
import PremiumTip from "@/backend/models/PremiumTip";
import { CheckCircle2 } from "lucide-react";
import PaystackCheckout from "@/components/PaystackCheckout";
import VipStrip from "@/components/VipStrip";
import VipPredictionsView from "@/components/vip/VipPredictionsView";

export const metadata = {
  title: "VIP Predictions | BookiesMasters",
  description: "Access curated VIP predictions and expert insights",
};

export default async function ProPage() {
  const session = await auth();

  // If user is logged in:
  if (session?.user) {
    // @ts-ignore
    if (session.user.role === 'admin') {
      redirect("/admin");
    }

    // @ts-ignore
    const vipExpiry = session.user.vipExpiry ? new Date(session.user.vipExpiry) : null;
    // @ts-ignore
    const isVIP = Boolean(session.user.isVip || (vipExpiry && vipExpiry > new Date()));

    return (
      <div className="w-full pb-12">
        {/* Subscribe to VIP strip just below navbar */}
        <VipStrip isVip={isVIP} />

        {/* Admin-edited Predictions View with Date Navigator */}
        <VipPredictionsView isVip={isVIP} />
      </div>
    );
  }

  // If unauthenticated:
  let winningTips: any[] = [];
  try {
    if (process.env.MONGO_URI) {
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGO_URI);
      }

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const tips = await PremiumTip.find({
        status: 'won',
        matchDate: { $gte: sevenDaysAgo }
      }).sort({ matchDate: -1 }).lean();

      const grouped: Record<string, any[]> = {};
      tips.forEach((tip: any) => {
        const dateObj = new Date(tip.matchDate);
        const dateKey = dateObj.toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(tip);
      });
      
      const sortedDates = Object.keys(grouped).sort((a, b) => (new Date(b)).getTime() - (new Date(a)).getTime());
      
      winningTips = sortedDates.slice(0, 5).map(dateStr => {
         const dayTips = grouped[dateStr];
         let totalOdds = 1.0;
         dayTips.forEach((t: any) => { totalOdds *= parseFloat(t.odds || "1"); });
         return {
            dateStr,
            totalOdds,
            matches: dayTips
         };
      });
    }
  } catch (err) {
    console.error("⚠️ Pro page Mongo query error:", err);
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-4 md:py-6 relative">
      <div className="text-center mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 tracking-tight mt-6 md:mt-0">
          Upgrade to <span className="text-teal-600">VIP</span>
        </h1>
        <p className="text-gray-600 text-[13px] max-w-xl mx-auto">
          Get premium predictions and expert insights for just <strong className="text-gray-900">$19 / week</strong>.
        </p>
      </div>

      {winningTips.length > 0 && (
        <div className="mb-8 w-[100vw] relative left-1/2 -translate-x-1/2">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-1.5 justify-center">
            <CheckCircle2 className="w-5 h-5 text-teal-500" /> 
            Recent VIP Winning Betslips
          </h2>
          <div className="flex overflow-x-auto pb-6 pt-2 gap-4 snap-x [&::-webkit-scrollbar]:hidden px-4 md:px-8 max-w-7xl mx-auto">
            {winningTips.map((slip: any) => {
              const d = new Date(slip.dateStr);
              const readableDate = !isNaN(d.getTime()) 
                ? d.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })
                : slip.dateStr;

              return (
                <div key={slip.dateStr} className="min-w-[300px] sm:min-w-[340px] flex-shrink-0 bg-white p-5 rounded-2xl border-2 border-[#63FF79]/40 shadow-xl snap-center relative overflow-hidden flex flex-col transform transition-transform hover:scale-[1.02]">
                  <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#63FF79]/20 blur-3xl rounded-full pointer-events-none"></div>
                  
                  <div className="flex justify-between items-start mb-5 relative z-10">
                    <div>
                      <div className="text-[10px] text-teal-600 font-bold uppercase tracking-widest mb-1">VIP Betslip</div>
                      <div className="text-xl font-black text-gray-900">{readableDate}</div>
                    </div>
                    <div className="text-right bg-gray-900 px-3 py-1.5 rounded-lg shadow-inner">
                       <div className="text-[9px] text-[#63FF79] font-bold uppercase mb-0.5">Total Odds</div>
                       <div className="text-xl font-black text-white leading-none">{slip.totalOdds.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 flex-1 relative z-10">
                    {slip.matches.map((tip: any) => (
                      <div key={tip._id.toString()} className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 shadow-sm">
                         <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] text-teal-600 font-bold uppercase truncate pr-2 tracking-wider">{tip.country} - {tip.league}</span>
                            <span className="text-green-600 text-[10px] font-bold uppercase bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">✔ Won</span>
                         </div>
                         <div className="font-bold text-gray-900 text-sm mb-3 leading-tight">{tip.homeTeam} <span className="text-gray-400 font-normal mx-1 text-xs">vs</span> {tip.awayTeam}</div>
                         <div className="flex justify-between items-center text-xs">
                           <span className="font-bold text-gray-700 bg-white px-3 py-1.5 rounded-md shadow-sm border border-gray-200 flex gap-2">
                             <span className="text-gray-400 uppercase text-[10px] font-bold">Pick</span> {tip.prediction}
                           </span>
                           {tip.score && (
                             <span className="font-black text-gray-900 bg-white px-3 py-1.5 rounded-md shadow-sm border border-gray-200 text-center tracking-wider">
                               {tip.score}
                             </span>
                           )}
                           <span className="font-bold text-teal-600 bg-white px-3 py-1.5 rounded-md shadow-sm border border-gray-200 flex gap-2">
                             <span className="text-gray-400 uppercase text-[10px] font-bold">Odds</span> {tip.odds}
                           </span>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto bg-white p-6 rounded-xl border border-teal-500/20 shadow-sm mt-8">
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Secure Checkout</h2>
          <p className="text-sm text-gray-600">Activate your 7-day VIP pass instantly.</p>
        </div>
        
        <PaystackCheckout amount={2500} currency="KES" displayText="Pay $19 to Unlock VIP" />
      </div>
    </div>
  );
}
