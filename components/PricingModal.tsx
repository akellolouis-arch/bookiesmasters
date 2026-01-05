"use client";

import React, { useState } from "react";
import { X, Check, Loader2 } from "lucide-react";

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubscribe = async () => {
        if (!email) {
            alert("Please enter your email to subscribe.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pay/initialize`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, amount: 99.99, plan: "monthly_vip" }), // Example Amount $9.99 or equivalent
            });

            const data = await response.json();

            if (data.success && data.authorization_url) {
                window.location.href = data.authorization_url;
            } else {
                alert("Failed to initialize payment. Please try again.");
            }
        } catch (error) {
            console.error("Payment Error:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-[#1a1f2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 text-center border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition">
                        <X size={24} />
                    </button>
                    <h2 className="text-2xl font-bold text-white mb-2">💎 Become a VIP</h2>
                    <p className="text-gray-400 text-sm">Unlock high-confidence predictions & stats</p>
                </div>

                {/* content */}
                <div className="p-6 space-y-6">
                    {/* Features */}
                    <ul className="space-y-3">
                        {[
                            "Daily High-Confidence Tips",
                            "Advanced Lineup Analysis",
                            "Live Injury Updates",
                            "Priority Support",
                        ].map((feature, i) => (
                            <li key={i} className="flex items-center gap-3 text-gray-300">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                    <Check size={14} />
                                </div>
                                {feature}
                            </li>
                        ))}
                    </ul>

                    {/* Price */}
                    <div className="text-center py-4 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-3xl font-bold text-white">$9.99</span>
                        <span className="text-gray-400 text-sm"> / month</span>
                    </div>

                    {/* Email Input */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1 ml-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition"
                        />
                    </div>

                    {/* Action */}
                    <button
                        onClick={handleSubscribe}
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Processing...
                            </>
                        ) : (
                            "Subscribe Now"
                        )}
                    </button>

                    <p className="text-xs text-center text-gray-500">
                        Secure payments via Paystack. Cancel anytime.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PricingModal;
