import React from "react";
import Image from "next/image";
import Link from "next/link";
import PaymentUploadForm from "./PaymentUploadForm";

export const metadata = {
  title: "Go Pro | BookiesMasters",
  description: "Get weekly VIP predictions and insights",
};

export default function ProPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          Upgrade to <span className="text-[#63FF79]">VIP</span>
        </h1>
        <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
          Get exclusive access to our premium predictions, high-confidence picks, and expert insights for just <strong className="text-white">$19 per week</strong>.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Payment Details Column */}
        <div className="bg-[#1F1F1F] rounded-xl p-6 border border-white/5 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-3">Payment Methods</h2>
          
          <div className="space-y-6">
            {/* M-Pesa */}
            <div className="bg-[#121212] p-4 rounded-lg border border-[#63FF79]/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#63FF79] text-black text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                For Kenyans
              </div>
              <h3 className="text-[#63FF79] font-bold mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#63FF79] animate-pulse"></span>
                M-Pesa
              </h3>
              <div className="text-gray-300 text-sm space-y-2">
                <p>Send exactly <strong className="text-white">Ksh 2,500</strong> (equivalent to $19) to:</p>
                <div className="bg-black/50 p-3 rounded font-mono text-center text-lg tracking-widest border border-white/10">
                  07XX XXX XXX
                </div>
                <p className="text-xs text-gray-500 mt-2">* Replace with your actual till/paybill or phone number.</p>
              </div>
            </div>

            {/* Binance */}
            <div className="bg-[#121212] p-4 rounded-lg border border-yellow-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                International
              </div>
              <h3 className="text-yellow-500 font-bold mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                Binance Pay
              </h3>
              <div className="text-gray-300 text-sm space-y-2">
                <p>Send exactly <strong className="text-white">19 USDT</strong> to:</p>
                <div className="bg-black/50 p-3 rounded font-mono text-center text-sm border border-white/10 break-all">
                  Pay ID: 123456789
                </div>
                <p className="text-xs text-gray-500 mt-2">* Replace with your actual Binance Pay ID or Wallet address.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Form Column */}
        <div className="bg-[#1F1F1F] rounded-xl p-6 border border-white/5 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-2">Verify Payment</h2>
          <p className="text-xs text-gray-400 mb-6">Upload a screenshot of your successful transaction to gain access immediately.</p>
          
          <PaymentUploadForm />
        </div>
      </div>
    </div>
  );
}
