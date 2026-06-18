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
        <div className="bg-[#1F1F1F] rounded-2xl p-8 border border-white/5 shadow-2xl flex flex-col items-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
            <Lock className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">VIP Access Required</h1>
          <p className="text-gray-400 mb-8 max-w-md">
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

  // Get tips from the last 2 days and future tips
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const tips = await PremiumTip.find({ matchDate: { $gte: twoDaysAgo } })
    .sort({ matchDate: -1 })
    .lean();

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#63FF79]/10 rounded-xl flex items-center justify-center border border-[#63FF79]/20">
            <Crown className="w-6 h-6 text-[#63FF79]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Premium VIP Tips</h1>
            <p className="text-sm text-[#63FF79] mt-1">
              Your subscription is active until {vipExpiry?.toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {tips.length === 0 ? (
          <div className="text-center py-12 bg-[#1F1F1F] rounded-xl border border-white/5">
            <p className="text-gray-400">Our experts are analyzing the next matches. New tips will be posted soon.</p>
          </div>
        ) : (
          tips.map((tip: any) => (
            <div key={tip._id.toString()} className="bg-[#1F1F1F] rounded-xl p-6 border border-[#63FF79]/20 shadow-lg relative overflow-hidden group">
              {/* Status Badge */}
              <div className="absolute top-0 right-0">
                {tip.status === 'won' && <span className="bg-green-500 text-black text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase">Won</span>}
                {tip.status === 'lost' && <span className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase">Lost</span>}
                {tip.status === 'pending' && <span className="bg-gray-700 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase flex items-center gap-1"><Clock size={10} /> Pending</span>}
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="text-xs text-[#63FF79] font-bold uppercase tracking-wider mb-2">{tip.country} - {tip.league}</div>
                  <h3 className="text-xl font-bold text-white mb-1">{tip.homeTeam} <span className="text-gray-500 font-normal">vs</span> {tip.awayTeam}</h3>
                  <div className="text-sm text-gray-400 flex items-center gap-2">
                    <Clock size={14} /> {new Date(tip.matchDate).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-[#121212] p-4 rounded-lg border border-white/5 min-w-[200px]">
                  <div className="flex-1">
                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Our Pick</div>
                    <div className="text-white font-bold">{tip.prediction}</div>
                  </div>
                  <div className="w-px h-8 bg-white/10 mx-2"></div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Odds</div>
                    <div className="text-[#63FF79] font-black text-lg">{tip.odds}</div>
                  </div>
                </div>
              </div>


            </div>
          ))
        )}
      </div>
    </div>
  );
}
