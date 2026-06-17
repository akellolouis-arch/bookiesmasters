"use client";

import { useState } from "react";
import { UploadCloud, CheckCircle, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function PaymentUploadForm() {
  const { data: session } = useSession();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [method, setMethod] = useState<"mpesa" | "binance">("mpesa");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      setError("Please log in to submit a payment proof.");
      // Optional: router.push('/login');
      return;
    }
    if (!file) {
      setError("Please select a screenshot to upload.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result;

        // 2. Send to our API route
        const response = await fetch("/api/upload-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: base64data,
            method: method,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setSuccess(true);
          setFile(null);
        } else {
          setError(data.error || "Failed to submit payment proof.");
        }
        setLoading(false);
      };
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="text-center p-6 bg-[#121212] rounded-lg border border-white/5">
        <p className="text-gray-400 text-sm mb-4">You must be logged in to submit a payment screenshot.</p>
        <button
          onClick={() => router.push('/api/auth/signin')}
          className="bg-[#63FF79] text-black font-bold py-2 px-6 rounded hover:bg-[#4ade80] transition-colors"
        >
          Login to Continue
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center p-8 bg-[#121212] rounded-lg border border-[#63FF79]/30 flex flex-col items-center justify-center">
        <CheckCircle className="w-16 h-16 text-[#63FF79] mb-4" />
        <h3 className="text-white font-bold text-lg mb-2">Proof Submitted!</h3>
        <p className="text-gray-400 text-sm">
          Thank you! The admin will review your payment and grant VIP access shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-red-500 bg-red-500/10 p-3 rounded text-sm font-medium">{error}</div>}
      
      <div>
        <label className="block text-gray-400 text-xs font-bold mb-2">Payment Method</label>
        <div className="flex gap-4">
          <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${method === 'mpesa' ? 'border-[#63FF79] bg-[#63FF79]/10' : 'border-white/10 bg-[#121212] hover:bg-white/5'}`}>
            <input type="radio" name="method" value="mpesa" checked={method === 'mpesa'} onChange={() => setMethod('mpesa')} className="hidden" />
            <span className={`text-sm font-bold ${method === 'mpesa' ? 'text-[#63FF79]' : 'text-gray-400'}`}>M-Pesa</span>
          </label>
          <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${method === 'binance' ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/10 bg-[#121212] hover:bg-white/5'}`}>
            <input type="radio" name="method" value="binance" checked={method === 'binance'} onChange={() => setMethod('binance')} className="hidden" />
            <span className={`text-sm font-bold ${method === 'binance' ? 'text-yellow-500' : 'text-gray-400'}`}>Binance</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-gray-400 text-xs font-bold mb-2">Payment Screenshot</label>
        <div className="border-2 border-dashed border-white/10 bg-[#121212] rounded-lg p-8 text-center hover:border-white/30 transition-colors relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center gap-2">
            <UploadCloud className="w-8 h-8 text-gray-400" />
            {file ? (
              <span className="text-sm text-[#63FF79] font-medium">{file.name}</span>
            ) : (
              <span className="text-sm text-gray-400 font-medium">Click to browse or drag image here</span>
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !file}
        className="w-full bg-[#63FF79] hover:bg-[#4ade80] text-black font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Payment Proof"}
      </button>
    </form>
  );
}
