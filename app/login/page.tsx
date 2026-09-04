import React from "react";
import Image from "next/image";
import { signIn } from "@/auth";
import logo from "@/public/bookiesmasters_text_v2.png";

export const metadata = {
  title: "Login | BookiesMasters",
  description: "Login to BookiesMasters to access your VIP predictions",
};

export default async function LoginPage(props: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const searchParams = await props.searchParams;
  const redirectUrl = searchParams?.callbackUrl || "/pro";

  return (
    <div className="w-full max-w-xs sm:max-w-sm mx-auto px-4 py-12 flex flex-col items-center">
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-xl w-full text-center">
        <div className="flex justify-center mb-4">
          <Image
            src={logo}
            alt="BookiesMasters Logo"
            className="h-6 w-auto object-contain skew-x-[12deg] origin-center"
            priority
          />
        </div>
        
        <h1 className="text-sm sm:text-base font-bold text-gray-900 mb-1">Welcome Back</h1>
        <p className="text-[11px] text-gray-600 mb-5 leading-relaxed">Sign in to access VIP predictions and manage your account.</p>
        
        <form
          action={async () => {
            "use server"
            await signIn("google", { redirectTo: redirectUrl })
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:border-teal-600 hover:bg-teal-50/50 shadow-xs text-gray-800 font-bold text-xs py-2 px-3 rounded-lg transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </form>

        <div className="mt-5 text-[10px] text-gray-400">
          By signing in, you agree to our Terms of Service & Privacy Policy.
        </div>
      </div>
    </div>
  );
}
