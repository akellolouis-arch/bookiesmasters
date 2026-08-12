import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import mongoose from "mongoose";
import PremiumTip from "@/backend/models/PremiumTip";
import { Lock, Crown, Clock } from "lucide-react";

export const metadata = {
  title: "VIP Premium Tips | BookiesMasters",
};

export const revalidate = 0;

export default async function VIPPage() {
  const session = await auth();

  // If not logged in, they shouldn't even see the locked screen, just send to login/pro
  if (!session || !session.user) {
    redirect("/api/auth/signin?callbackUrl=/vip");
  }

  // @ts-ignore
  const vipExpiry = session.user.vipExpiry ? new Date(session.user.vipExpiry) : null;
  const now = new Date();
  const isVIP = vipExpiry && vipExpiry > now;
  // @ts-ignore
  const isAdmin = session.user.role === 'admin';

  if (!isVIP && !isAdmin) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-2xl flex flex-col items-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
            <Lock className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">VIP Access Required</h1>
          <p className="text-gray-600 mb-8 max-w-md">
            Your VIP subscription has either expired or you haven't subscribed yet. Get access to our most confident daily picks by upgrading today.
          </p>
          <Link href="/pro" className="bg-[#63FF79] text-black font-bold py-3 px-8 rounded-full hover:bg-[#4ade80] transition-transform hover:scale-105 shadow-[0_0_15px_rgba(99,255,121,0.2)]">
            Upgrade to VIP
          </Link>
        </div>
      </div>
    );
  }

  // User is VIP (or Admin), fetch premium tips
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI || "");
  }

  // Get tips from the last 7 days and future tips
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const tips = await PremiumTip.find({ matchDate: { $gte: sevenDaysAgo } })
    .sort({ matchDate: -1 })
    .lean();

  // Group tips by Date (Africa/Nairobi time)
  const groupedTips: Record<string, any[]> = {};
  tips.forEach((tip: any) => {
    const dateObj = new Date(tip.matchDate);
    const dateKey = dateObj.toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" }); // YYYY-MM-DD
    if (!groupedTips[dateKey]) {
      groupedTips[dateKey] = [];
    }
    groupedTips[dateKey].push(tip);
  });

  const sortedDates = Object.keys(groupedTips).sort((a, b) => (new Date(b)).getTime() - (new Date(a)).getTime());

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-300">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#63FF79]/10 rounded-xl flex items-center justify-center border border-[#63FF79]/20">
            <Crown className="w-6 h-6 text-[#63FF79]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Premium VIP Tips</h1>
            <p className="text-sm text-[#63FF79] mt-1">
              Your subscription is active until {vipExpiry?.toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {sortedDates.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
            <p className="text-gray-600">Our experts are analyzing the next matches. New tips will be posted soon.</p>
          </div>
        ) : (
          sortedDates.map((dateStr) => {
            const dayTips = groupedTips[dateStr];
            
            let overallStatus = "won";
            let totalOdds = 1.0;
            
            dayTips.forEach((t: any) => {
               if (t.status === 'lost') overallStatus = 'lost';
               else if (t.status === 'pending' && overallStatus !== 'lost') overallStatus = 'pending';
               
               totalOdds *= parseFloat(t.odds || "1");
            });

            // Make the date readable
            const d = new Date(dateStr);
            const readableDate = !isNaN(d.getTime()) 
              ? d.toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
              : dateStr;

            return (
              <div key={dateStr} className="bg-white rounded-2xl border border-[#63FF79]/30 shadow-lg overflow-hidden flex flex-col">
                {/* Ticket Header */}
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{readableDate}</h2>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Daily VIP Betslip</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                       <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Total Odds</p>
                       <p className="text-2xl font-black text-[#63FF79] drop-shadow-sm">{totalOdds.toFixed(2)}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-300"></div>
                    <div>
                      {overallStatus === 'won' && <span className="bg-green-500 text-black text-xs font-bold px-4 py-2 rounded-lg uppercase shadow-sm">Won</span>}
                      {overallStatus === 'lost' && <span className="bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-lg uppercase shadow-sm">Lost</span>}
                      {overallStatus === 'pending' && <span className="bg-gray-200 text-gray-700 text-xs font-bold px-4 py-2 rounded-lg uppercase shadow-sm flex items-center gap-1"><Clock size={12} /> Pending</span>}
                    </div>
                  </div>
                </div>
                
                {/* Ticket Body (Matches) */}
                <div className="divide-y divide-gray-100 flex-1">
                  {dayTips.map((tip: any) => (
                    <div key={tip._id.toString()} className="p-5 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                        <div className="flex-1">
                          <div className="text-[10px] text-[#63FF79] font-bold uppercase tracking-wider mb-1">{tip.country} - {tip.league}</div>
                          <div className="text-base font-bold text-gray-900">{tip.homeTeam} <span className="text-gray-400 font-normal text-sm mx-1">vs</span> {tip.awayTeam}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-2">
                            <Clock size={12} /> {new Date(tip.matchDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 sm:gap-6 bg-white sm:bg-transparent p-3 sm:p-0 rounded-lg border sm:border-none border-gray-100 mt-2 sm:mt-0">
                          <div className="text-center">
                            <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Pick</div>
                            <div className="text-gray-900 font-bold">{tip.prediction}</div>
                          </div>
                          <div className="w-px h-6 bg-gray-200"></div>
                          <div className="text-center">
                            <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Odds</div>
                            <div className="text-gray-900 font-bold">{tip.odds}</div>
                          </div>
                          <div className="w-px h-6 bg-gray-200"></div>
                          <div className="w-16 text-right flex items-center justify-end">
                             {tip.status === 'won' && <span className="text-green-600 text-xs font-bold uppercase flex items-center gap-1">✔ Won</span>}
                             {tip.status === 'lost' && <span className="text-red-600 text-xs font-bold uppercase flex items-center gap-1">✘ Lost</span>}
                             {tip.status === 'pending' && <span className="text-gray-400 text-xs font-bold uppercase flex items-center gap-1"><Clock size={10} /> Wait</span>}
                          </div>
                        </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
