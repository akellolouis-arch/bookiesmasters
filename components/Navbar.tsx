"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
// import logo from "@/public/logo.png"; 
// Use the new stylized TEXT logo
import logo from "@/public/bookiesmasters_text_v2.png";


export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);



  const links = [
    { name: "Home", path: "/" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#1F1F1F] text-white shadow-md">
      {/*
        Avoid justify-between: when the logo image hasn’t painted yet, the left slot can
        collapse and the hamburger reads as “first”. Logo → flex spacer → links / toggler.
      */}
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

        <div className="hidden shrink-0 items-center space-x-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.path}
              className="text-emerald-200/70 hover:text-white transition font-medium"
            >
              {link.name}
            </Link>
          ))}
          <Link
            href="/vip"
            className="px-4 py-1.5 bg-[#1F1F1F] border border-[#63FF79]/30 text-[#63FF79] font-bold rounded-full text-xs hover:scale-105 transition-transform shadow-[0_0_10px_rgba(99,255,121,0.15)]"
          >
            GO PRO
          </Link>
        </div>

        <Link
          href="/vip"
          className="flex md:hidden items-center justify-center shrink-0 px-3 py-1 bg-[#1F1F1F] border border-[#63FF79]/30 text-[#63FF79] font-bold tracking-wide rounded-full text-[10px] shadow-[0_0_8px_rgba(99,255,121,0.15)]"
        >
          GO PRO
        </Link>
      </div>

    </nav>
  );
}
