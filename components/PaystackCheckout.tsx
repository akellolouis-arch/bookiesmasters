"use client";

import { useState, useEffect } from "react";
import { usePaystackPayment } from "react-paystack";
import { useSession } from "next-auth/react";
import { Loader2, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface PaystackCheckoutProps {
  amount?: number;
  currency?: string;
  displayText?: string;
  variant?: "default" | "white";
}

export default function PaystackCheckout({
  amount = 2500,
  currency = "KES",
  displayText,
  variant = "default",
}: PaystackCheckoutProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fire InitiateCheckout when the user views the payment option
    // @ts-ignore
    if (typeof window !== "undefined" && window.fbq) {
      // @ts-ignore
      window.fbq('track', 'InitiateCheckout', { currency: currency, value: amount });
    }
  }, [currency, amount]);

  const config = {
    reference: `BM-${new Date().getTime()}`,
    email: session?.user?.email || "",
    amount: amount * 100, // Paystack expects amount in kobo/cents
    currency: currency,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string,
  };

  // @ts-ignore
  const initializePayment = usePaystackPayment(config);

  const onSuccess = async (reference: any) => {
    setVerifying(true);
    setError("");
    setLoading(false);
    try {
      const res = await fetch("/api/verify-paystack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: reference.reference }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        // Fire Purchase event upon successful verification
        // @ts-ignore
        if (typeof window !== "undefined" && window.fbq) {
          // @ts-ignore
          window.fbq('track', 'Purchase', { currency: currency, value: amount });
        }
        
        setSuccess(true);
        setTimeout(() => {
          router.push("/pro");
          router.refresh();
        }, 2000);
      } else {
        setError(data.error || "Payment verification failed. Please contact support.");
      }
    } catch (err) {
      setError("An error occurred during verification. Please contact support.");
    } finally {
      setVerifying(false);
    }
  };

  const onClose = () => {
    setLoading(false);
    setVerifying(false);
  };

  const handlePayment = () => {
    if (!session) {
      router.push("/api/auth/signin?callbackUrl=/pro");
      return;
    }
    if (!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) {
       setError("Payment configuration missing. Please check API keys.");
       return;
    }
    setLoading(true);
    setError("");

    try {
      // @ts-ignore
      initializePayment(onSuccess, onClose);
    } catch (err) {
      console.error("Failed to initialize Paystack:", err);
      setError("Unable to open payment modal. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-teal-50 border border-teal-500/20 rounded-lg text-center">
        <CheckCircle className="w-12 h-12 text-teal-500 mb-3" />
        <h3 className="text-gray-900 font-bold text-lg mb-1">Payment Successful!</h3>
        <p className="text-gray-600 text-sm">Your VIP access has been activated. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      {error && <div className="w-full text-red-500 bg-red-500/10 p-3 rounded text-sm font-medium mb-4 text-center">{error}</div>}
      
      <button
        onClick={handlePayment}
        disabled={loading || verifying}
        className={
          variant === "white"
            ? "w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:border-teal-600 hover:bg-teal-50/50 shadow-xs text-gray-800 font-bold text-xs py-2.5 px-3 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            : "w-full bg-[#09A5A3] hover:bg-[#078C8A] text-white font-bold py-3.5 px-6 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg hover:shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        }
      >
        {(loading || verifying) ? (
          <><Loader2 className={`w-4 h-4 animate-spin ${variant === "white" ? "text-teal-600" : "text-white"}`} /> {verifying ? "Verifying..." : "Loading..."}</>
        ) : (
          displayText || `Pay ${currency} ${amount.toLocaleString()} to Unlock VIP`
        )}
      </button>
      <p className={`text-center ${variant === "white" ? "text-[10px] text-gray-400 mt-3" : "text-xs text-gray-500 mt-3"}`}>
        Secure payment processed by Paystack. Mobile Money and Cards supported.
      </p>
    </div>
  );
}
