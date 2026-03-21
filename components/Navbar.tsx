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
    { name: "Predictions", path: "/" },
  ];

  return (
    <nav className="w-full bg-[#1F1F1F] text-white shadow-md">
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
            className="h-[17px] w-auto max-w-full object-contain object-left"
            priority
          />
        </Link>

        <div className="min-w-0 flex-1" aria-hidden="true" />

        <div className="hidden shrink-0 items-center space-x-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.path}
              className="text-gray-300 hover:text-white transition"
            >
              {link.name}
            </Link>
          ))}
        </div>

        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center text-[#63FF79] hover:text-[#4CE060] md:hidden font-bold"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle Menu"
        >
          {menuOpen ? <X size={20} strokeWidth={4} /> : <Menu width={30} height={18} strokeWidth={4} preserveAspectRatio="none" className="-skew-x-[10deg]" />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-gray-800 border-t border-gray-700">
          <div className="flex flex-col px-4 py-3 space-y-3">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.path}
                onClick={() => setMenuOpen(false)}
                className="text-gray-300 hover:text-white transition"
              >
                {link.name}
              </Link>
            ))}

          </div>
        </div>
      )
      }


    </nav>
  );
}
