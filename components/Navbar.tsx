"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import logo from "@/public/bookiesmasters_text_v2.png";
import AuthModal from "./AuthModal";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const links = [
    { name: "Home", path: "/" },
  ];

  const isAuthenticated = status === "authenticated";
  // @ts-ignore
  const isAdmin = session?.user?.role === "admin";

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-teal-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-2 py-0 md:px-8 flex h-[60px] items-center gap-2">
          <Link
            href="/"
            className="relative z-10 flex min-h-[17px] min-w-[120px] max-w-[min(260px,72vw)] shrink-0 items-center"
          >
            <Image
              src={logo}
              alt="BookiesMasters Logo"
              className="h-[17px] w-auto max-w-full object-contain object-left skew-x-[12deg] origin-center"
              priority
            />
          </Link>

          <div className="min-w-0 flex-1" aria-hidden="true" />

          <div className="hidden shrink-0 items-center space-x-4 md:flex">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.path}
                className="text-gray-200 hover:text-white transition font-medium text-sm"
              >
                {link.name}
              </Link>
            ))}

            {isAuthenticated ? (
              <>
                <Link
                  href="/pro"
                  className="px-3 py-1 bg-teal-800/60 border border-[#63FF79]/40 text-[#63FF79] font-bold rounded-full text-xs hover:bg-teal-800 transition"
                >
                  VIP TIPS
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="px-3 py-1 bg-amber-600/80 border border-amber-300 text-white font-bold rounded-full text-xs hover:bg-amber-600 transition"
                  >
                    ADMIN
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-4 py-1.5 bg-red-600/90 border border-red-400 text-white font-bold rounded-full text-xs hover:bg-red-700 transition-transform shadow-sm"
                >
                  LOGOUT
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-1.5 bg-teal-700 border border-[#63FF79]/40 text-[#63FF79] font-bold rounded-full text-xs hover:scale-105 transition-transform shadow-sm"
              >
                GO PRO
              </button>
            )}
          </div>

          {/* Mobile View Buttons */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            {isAuthenticated ? (
              <>
                <Link
                  href="/pro"
                  className="px-2.5 py-1 bg-teal-800/60 border border-[#63FF79]/40 text-[#63FF79] font-bold rounded-full text-[10px]"
                >
                  VIP
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="px-2.5 py-1 bg-amber-600/80 border border-amber-300 text-white font-bold rounded-full text-[10px]"
                  >
                    ADMIN
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-2.5 py-1 bg-red-600/90 border border-red-400 text-white font-bold rounded-full text-[10px]"
                >
                  LOGOUT
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 py-1 bg-teal-700 border border-[#63FF79]/30 text-[#63FF79] font-bold tracking-wide rounded-full text-[10px] shadow-sm"
              >
                GO PRO
              </button>
            )}
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
