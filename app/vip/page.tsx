
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Lock, Crown, CheckCircle } from "lucide-react"

export default async function TopPredictionsPage() {
    const session = await auth()

    if (!session) {
        redirect("/login")
    }

    // @ts-ignore
    const isVip = session.user?.isVip;

    if (!isVip) {
        return (
            <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-[#1F1F1F] p-8 rounded-2xl max-w-md w-full border border-yellow-500/20 shadow-2xl space-y-6">
                    <div className="mx-auto bg-yellow-500/10 w-20 h-20 rounded-full flex items-center justify-center">
                        <Lock size={40} className="text-yellow-500" />
                    </div>

                    <h1 className="text-2xl font-bold text-white">VIP Content Locked</h1>
                    <p className="text-gray-400 text-sm">
                        This section contains our highest confidence predictions (85%+ Win Rate).
                        You need an active membership to view these tips.
                    </p>

                    <div className="bg-black/40 p-4 rounded-lg text-left space-y-3">
                        <div className="flex items-center gap-3 text-sm text-gray-300">
                            <CheckCircle size={16} className="text-teal-400" />
                            <span>High Confidence Tips</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-300">
                            <CheckCircle size={16} className="text-teal-400" />
                            <span>Daily Email Alerts</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-300">
                            <CheckCircle size={16} className="text-teal-400" />
                            <span>Cancel Anytime</span>
                        </div>
                    </div>

                    <button className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold py-4 rounded-xl hover:scale-[1.02] transition-transform">
                        Unlock for $9.99/mo (Coming Soon)
                    </button>
                </div>
            </div>
        )
    }

    // ------------------------------------------
    // VIP VIEW (Authorized)
    // ------------------------------------------
    return (
        <div className="min-h-screen bg-[#111111] p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8 flex items-center gap-4">
                    <div className="bg-yellow-500/20 p-3 rounded-full">
                        <Crown size={32} className="text-yellow-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white">VIP Predictions</h1>
                        <p className="text-teal-400 text-sm">High Confidence • Verified Stats</p>
                    </div>
                </header>

                {/* Example VIP Content - We will wire this to backend later */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#1F1F1F] border border-teal-500/30 p-6 rounded-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-teal-500 text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
                            92% CONFIDENCE
                        </div>
                        <h3 className="text-gray-400 text-xs uppercase mb-2">England • Premier League</h3>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xl font-bold text-white">Arsenal</span>
                            <span className="text-gray-500">vs</span>
                            <span className="text-xl font-bold text-white">Chelsea</span>
                        </div>
                        <div className="bg-black/40 p-4 rounded-lg border border-white/5">
                            <p className="text-sm text-gray-400 mb-1">Prediction:</p>
                            <p className="text-lg font-bold text-teal-400">Home Win & Over 1.5 Goals</p>
                            <p className="text-xs text-gray-500 mt-2">Reason: Arsenal generic strong form...</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
